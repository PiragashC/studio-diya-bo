const User = require("../models/userModel");
const Order = require("../models/order");

/* view bookings (common for both user, vendor and admin) */
const getAllBookings = async (req, res) => {
  try {
    // Extract query parameters and user information from the request
    const { page, limit, status, date, orderId, customerDetail, orderDate } =
      req.query; // Added customerDetail
    const { id, role } = req.user;

    // Initialize userId if the role is "User"
    let userId;

    if (role === "User") {
      userId = id;
    }

    // Construct the query object based on userId, companyId, status, date, and customer details
    const query = {};

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      // Validate status value
      if (
        status !== "Paid" &&
        status !== "Unpaid" &&
        status !== "Not Fully Paid" &&
        status !== "Overpaid - Balance Due" &&
        status !== "Balance Settled"
      ) {
        return res.status(400).json({ error: "Invalid Status" });
      }
      query.status = status;
    }

    if (date) {
      // Convert the date string (dd/mm/yyyy) to a Date object
      const [day, month, year] = date.split("/");
      const startDate = new Date(Number(year), Number(month) - 1, Number(day));

      // Set the time range to include the whole day
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    if (orderId) {
      // Use a regex to find booking IDs that start with the provided bookingId
      query.orderId = { $regex: `^${orderId}`, $options: "i" }; // 'i' option makes the search case-insensitive
    }

    if (customerDetail) {
      // Use regex to filter by customer name or mobile number (case-sensitive)
      const customerRegex = new RegExp(customerDetail, "g"); // 'g' ensures that the search is case-sensitive

      query.$or = [
        { "customerDetails.name": { $regex: customerRegex } },
        { "customerDetails.mobileNumber": { $regex: customerRegex } },
      ];
    }

    if (orderDate) {
      query.orderDate = orderDate;
    }

    // Count total documents matching the query
    const totalCount = await Order.countDocuments(query);

    // Fetch the bookings matching the query with pagination
    const allOrders = await Order.find(query)
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    // Return 404 if no bookings are found
    if (allOrders.length === 0) {
      return res.status(404).json({ error: "No bookings found" });
    }

    return res.status(200).json({
      totalCount,
      data: allOrders,
    });
  } catch (err) {
    // Return 500 if an error occurs
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllBookings,
};
