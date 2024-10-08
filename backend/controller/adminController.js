const OrderType = require("../models/orderType");
const Order = require("../models/order");

/* create new order type */
const createOrderType = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "Admin") {
      return res.status(403).json({ error: "You are not authorized" });
    }

    const { orderType, unitPrice } = req.body;

    // Check if the orderType already exists
    const existingOrderType = await OrderType.findOne({ orderType });
    if (existingOrderType) {
      return res.status(400).json({ error: "Order type already exists" });
    }

    // Create a new order type
    const newOrderType = new OrderType({
      orderType,
      unitPrice,
    });

    // Save the new order type to the database
    await newOrderType.save();

    return res.status(201).json({
      message: "Order type created successfully",
      orderType: newOrderType,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

/* get all order types */
const getOrderTypes = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "Admin") {
      return res.status(403).json({ error: "You are not authorized" });
    }

    // Count total documents matching the query
    const totalCount = await OrderType.countDocuments();

    const allOrderTypes = await OrderType.find()
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    return res.status(200).json({
      data: allOrderTypes,
      totalCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

/* update order types */
const updateOrderTypes = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "Admin") {
      return res.status(403).json({ error: "You are not authorized" });
    }

    const { id } = req.params;
    const { orderType, unitPrice } = req.body;

    // Check if the order type exists
    const updatingOrderType = await OrderType.findById(id);
    if (!updatingOrderType) {
      return res.status(404).json({ error: "Order type not found" });
    }

    // Update the order type with provided fields
    const updatedOrderType = await OrderType.findByIdAndUpdate(
      id,
      {
        $set: {
          orderType: orderType || updatingOrderType.orderType,
          unitPrice: unitPrice || updatingOrderType.unitPrice,
        },
      },
      { new: true } // Return the updated document
    );

    return res.status(200).json({
      message: "Order type updated successfully",
      orderType: updatedOrderType,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

const createOrderTypeObjForQuantity = async (orderItems) => {
  let totalAmount = 0;
  const orderDetails = [];

  for (const item of orderItems) {
    const { id, quantity } = item;
    if (!id) {
      throw new Error("Each order item must contain order type id!");
    }

    const orderType = await OrderType.findById(id);
    if (!orderType) {
      throw new Error(`Order type with id ${id} not found!`);
    }

    totalAmount += orderType.unitPrice * (quantity || 1);

    // Add each order item with quantity to the array
    orderDetails.push({
      ...orderType.toObject(), // Convert Mongoose object to plain object
      quantity,
    });
  }

  // Return an object with the order details and total amount
  return {
    orderDetails,
    totalAmount,
  };
};

/* find the total amount for the selected order type and quantity*/
const getTotalAmount = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "Admin") {
      return res.status(403).json({ error: "You are not authorized" });
    }

    const { orderItems } = req.query; // orderItems expected as a JSON string in query parameters
    if (!orderItems) {
      return res.status(400).json({ error: "Order items required!" });
    }

    let parsedItems;
    try {
      parsedItems = JSON.parse(orderItems);
    } catch (error) {
      return res.status(400).json({ error: "Invalid order items format!" });
    }

    if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
      return res
        .status(400)
        .json({ error: "Order items must be a non-empty array!" });
    }

    const orArr = await createOrderTypeObjForQuantity(parsedItems);

    return res.status(200).json({ totalAmount: orArr.totalAmount });
  } catch (err) {
    if (err.message.includes("not found") || err.message.includes("id")) {
      return res.status(404).json({ error: err.message });
    }

    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

async function generateOrderId() {
  const latestOrder = await Order.findOne()
    .sort({ createdAt: -1 })
    .select("orderId")
    .exec();
  if (latestOrder && latestOrder.orderId) {
    const lastIdNumber = parseInt(latestOrder.orderId.split("-")[1]);
    const newIdNumber = lastIdNumber + 1;
    return `SD-${newIdNumber.toString().padStart(6, "0")}`;
  } else {
    return "SD-000100";
  }
}

/* create an order */
const createOrder = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "Admin") {
      return res.status(403).json({ error: "You are not authorized" });
    }

    const { customerDetails, orderDetails, paidAmount, orderDate } = req.body;

    if (!customerDetails || !orderDetails || !orderDate) {
      return res.status(400).json({ error: "Order details are required!" });
    }

    const { name, mobileNumber } = customerDetails;
    if (!name || !mobileNumber) {
      return res.status(400).json({ error: "Customer details are required!" });
    }

    if (!Array.isArray(orderDetails) || orderDetails.length === 0) {
      return res
        .status(400)
        .json({ error: "Order items must be a non-empty array!" });
    }

    // Validate paidAmount, if not provided, set default to 0
    const paid = paidAmount != null ? paidAmount : 0;

    // Generate order details
    const orArr = await createOrderTypeObjForQuantity(orderDetails);

    let order = [];
    if (orArr) {
      order = orArr.orderDetails.map((od) => {
        return {
          id: od._id,
          orderType: od.orderType,
          unitPrice: od.unitPrice,
          quantity: od.quantity,
        };
      });
    }

    const orderId = await generateOrderId();
    const totalAmount = orArr.totalAmount;

    // Determine order status based on paidAmount and totalAmount
    let status;
    if (paid == 0) {
      status = "Unpaid";
    } else if (paid < totalAmount) {
      status = "Not Fully Paid";
    } else if (paid == totalAmount) {
      status = "Paid";
    } else if (paid > totalAmount) {
      status = "Overpaid - Balance Due";
    }

    // Create new order document
    const newOrder = new Order({
      orderId,
      customerDetails,
      orderDetails: order,
      total: totalAmount,
      paidAmount: paid,
      status,
      orderDate
    });

    // Save the new order
    await newOrder.save();

    return res
      .status(201)
      .json({ message: "Order created successfully", order: newOrder });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

/* edit order */
const editOrder = async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== "Admin") {
      return res.status(403).json({ error: "You are not authorized" });
    }

    const { id } = req.params;
    const { customerDetails, orderDetails, paidAmount, orderDate } = req.body;

    // Fetch the existing order
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate customerDetails and orderDetails
    if (!customerDetails && !orderDetails && !paidAmount && !orderDate) {
      return res
        .status(400)
        .json({ error: "Please provide detail to be updated!" });
    }

    const { name, mobileNumber } = customerDetails;

    if (!Array.isArray(orderDetails) || orderDetails.length === 0) {
      return res
        .status(400)
        .json({ error: "Order items must be a non-empty array!" });
    }

    // Validate paidAmount, if not provided, set default to 0
    const paid = paidAmount || existingOrder.paidAmount;

    // Generate updated order details
    const orArr = await createOrderTypeObjForQuantity(orderDetails);

    let updatedOrderDetails = [];
    if (orArr) {
      updatedOrderDetails = orArr.orderDetails.map((od) => {
        return {
          id: od._id,
          orderType: od.orderType,
          unitPrice: od.unitPrice,
          quantity: od.quantity,
        };
      });
    }

    const totalAmount = orArr.totalAmount;

    // Determine order status based on paidAmount and totalAmount
    let status;
    if (paid === 0) {
      status = "Unpaid";
    } else if (paid < totalAmount) {
      status = "Not Fully Paid";
    } else if (paid === totalAmount) {
      status = "Paid";
    } else if (paid > totalAmount) {
      status = "Overpaid - Balance Due";
    }

    // Update order fields
    existingOrder.customerDetails = {
      name: name || existingOrder.customerDetails.name,
      mobileNumber: mobileNumber || existingOrder.customerDetails.mobileNumber,
    };
    existingOrder.orderDetails = updatedOrderDetails;
    existingOrder.total = totalAmount;
    existingOrder.paidAmount = paid;
    existingOrder.status = status;
    existingOrder.orderDate = orderDate || existingOrder.orderDate;

    // Save updated order
    await existingOrder.save();

    return res
      .status(200)
      .json({ message: "Order updated successfully", order: existingOrder });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

/* change the order status to balance settled */
const changeOrderStatusToBalanceSettled = async (req, res) => {
  try {
    const { role } = req.user;
    const { id } = req.params; // Assuming you're passing the order ID in the URL

    if (role !== "Admin") {
      return res.status(403).json({ error: "You are not authorized" });
    }

    // Fetch the order by orderId
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check the current status of the order
    if (order.status === "Overpaid - Balance Due") {
      // Change to "Balance Settled"
      order.status = "Balance Settled";
    } else if (order.status === "Balance Settled") {
      // Change to "Overpaid - Balance Due"
      order.status = "Overpaid - Balance Due";
    } else {
      return res.status(400).json({ error: "Order status cannot be changed" });
    }

    // Save the updated order
    await order.save();

    return res.status(200).json({ message: "Order status updated successfully", order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};

/* delete order types */
const deleteOrderTypes = async (req, res) => {
  try{
    const { role } = req.user;
    const { id } = req.params; 
    if (role !== "Admin") {
      return res.status(403).json({ error: "You are not authorized" });
    };

    const deletionResult = await OrderType.deleteOne({ _id: id });

    if (deletionResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Order type not found!' });
    }

    res.status(200).json({ message: 'Order type deleted successfully' });

  }catch(err){
    console.error(err);
    return res.status(500).json({ error: err.message });
  };
};


module.exports = {
  createOrderType,
  getOrderTypes,
  updateOrderTypes,
  getTotalAmount,
  createOrder,
  editOrder,
  changeOrderStatusToBalanceSettled,
  deleteOrderTypes
};
