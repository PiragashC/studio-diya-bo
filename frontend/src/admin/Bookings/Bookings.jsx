import React, { useState, useEffect, useRef } from "react";
// import './Bookings.css';
import "./Dashboard.css";
import "./Dashboard-responsive.css";
import Preloader from "../../Preloader";

import { Calendar } from "primereact/calendar";
import { Ripple } from "primereact/ripple";
import { Divider } from "primereact/divider";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";

import { SampleData } from "../../BookingData";
import { useSelector } from "react-redux";

import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";

const Bookings = () => {
  const toast = useRef(null);
  const today = new Date();
  const [loading, setLoading] = useState(false);
  const [pdfGeneatorLoading, setPdfGenerateLoading] = useState(false);
  const [bookingDate, setBookingDate] = useState(null);
  const [searchKey, setSearchKey] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [bookings, setBookings] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [rows, setRows] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [rowPerPage, setRowsPerPage] = useState([5]);
  const [orderDate, setOrderDate] = useState(null);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [changeStatusLoading, setChangeStatusLoading] = useState(false);

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const exportToPDF = async () => {
    setPdfGenerateLoading(true);
    const doc = new jsPDF();

    const logoUrl = "/assets/images/diya_logo.png";
    const logoBase64 = await loadImageToBase64(logoUrl);

    const logoWidth = 150;
    const logoHeight = 20;
    const pageWidth =
      doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
    const logoX = (pageWidth - logoWidth) / 2;
    const pageHeight =
      doc.internal.pageSize.height || doc.internal.pageSize.getHeight();

    // *** Add border box for the entire page ***
    const margin = 10; // Set margin for the border
    doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

    // Add logo to the PDF
    doc.addImage(logoBase64, "PNG", logoX, 0, logoWidth, 80, undefined, "FAST");

    // Invoice status based on selectedBooking.status
    let statusText = "";
    switch (selectedBooking.status) {
      case "Paid":
        statusText = "Paid - Fully paid, no balance due";
        break;
      case "Unpaid":
        statusText = "Unpaid - No amount paid yet";
        break;
      case "Not Fully Paid":
        statusText =
          "Not Fully Paid - Partial payment made, but not the total amount";
        break;
      case "Overpaid - Balance Due":
        statusText =
          "Overpaid - Paid more than the total amount, balance needs to be refunded";
        break;
      case "Balance Settled":
        statusText =
          "Balance Settled - Overpayment balance has been refunded or adjusted";
        break;
      default:
        statusText = "Unknown Status";
    }

    // Add Invoice Status below the logo (centered, bold, larger font)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(statusText, pageWidth / 2, logoHeight + 35, { align: "center" });

    // User details and dates
    const invoiceNo = selectedBooking?.orderId;
    const printDate = formatDate(new Date());
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // Date on right side
    const dateWidth = doc.getTextWidth(`Date: ${printDate}`);
    doc.text(`Date: ${printDate}`, pageWidth - dateWidth - 14, logoHeight + 45);

    // Admin information (right side below the date)
    const adminName = "Studio Diya";
    const adminMobile = "0768322279";
    const adminAddress = "15, Kathi Apupakkar Veethy, Navanthurai, Jaffna";
    const adminInfo = `Admin: ${adminName}\nMobile: ${adminMobile}\nAddress: ${adminAddress}`;

    doc.text(
      `Admin: ${adminName}`,
      pageWidth - doc.getTextWidth(`Admin: ${adminName}`) - 14,
      logoHeight + 55
    );
    doc.text(
      `Mobile: ${adminMobile}`,
      pageWidth - doc.getTextWidth(`Mobile: ${adminMobile}`) - 14,
      logoHeight + 65
    );
    doc.text(
      `Address: ${adminAddress}`,
      pageWidth - doc.getTextWidth(`Address: ${adminAddress}`) - 14,
      logoHeight + 75
    );

    // Invoice ID (left aligned below logo)
    doc.text(`Invoice No: ${invoiceNo}`, 14, logoHeight + 45);

    // Customer details (move below the Invoice ID to prevent overlap)
    const customerDetails = {
      name: selectedBooking.customerDetails.name,
      mobileNumber: selectedBooking.customerDetails.mobileNumber,
    };
    doc.text(`Customer: ${customerDetails.name}`, 14, logoHeight + 55); // Change this Y position
    doc.text(`Mobile: ${customerDetails.mobileNumber}`, 14, logoHeight + 65); // Change this Y position

    // Increase margin to avoid overlap with the table
    const customerDetailsHeight = 100; // Adjust this height to create enough margin after the customer details

    // Columns configuration
    const columns = [
      { title: "#", dataKey: "index" },
      { title: "Description", dataKey: "orderType" },
      { title: "Quantity", dataKey: "quantity" },
      { title: "Unit Price", dataKey: "unitPrice" },
      { title: "Sub Total", dataKey: "subTotal" },
    ];

    // Prepare data for the table
    const data = selectedBooking.orderDetails.map((order, index) => ({
      index: index + 1,
      orderType: order.orderType,
      quantity: `${order.quantity} Pc(s)`,
      unitPrice: `Rs ${order.unitPrice}`,
      subTotal: `Rs ${order.quantity * order.unitPrice}`,
    }));

    // Add the table with order details
    doc.autoTable({
      head: [columns.map((col) => col.title)],
      body: data.map((row) => columns.map((col) => row[col.dataKey])),
      margin: { top: customerDetailsHeight }, // Add margin below customer details
    });

    // Calculate totals
    const total = selectedBooking.total;
    const paidAmount = selectedBooking.paidAmount || 0;
    const totalDue = total - paidAmount;
    const balance = paidAmount - total;

    // Get the Y position after the table is rendered
    const finalY = doc.autoTable.previous.finalY || customerDetailsHeight;

    // Footer totals and conditions based on status
    if (
      selectedBooking.status === "Paid" ||
      selectedBooking.status === "Balance Settled"
    ) {
      // Do not show Total Due or Balance if the status is Paid or Balance Settled
      doc.text("Total", 14, finalY + 10);
      doc.text(`Rs ${total}`, 150, finalY + 10);
    } else if (selectedBooking.status === "Overpaid - Balance Due") {
      // Show Balance instead of Total Due
      doc.text("Total", 14, finalY + 10);
      doc.text(`Rs ${total}`, 150, finalY + 10);

      doc.text("Paid Amount", 14, finalY + 20);
      doc.text(`Rs ${paidAmount}`, 150, finalY + 20);

      doc.text("Balance", 14, finalY + 30);
      doc.text(`Rs ${balance}`, 150, finalY + 30);
    } else {
      // Show Total Due for Unpaid and Not Fully Paid statuses
      doc.text("Total", 14, finalY + 10);
      doc.text(`Rs ${total}`, 150, finalY + 10);

      doc.text("Paid Amount", 14, finalY + 20);
      doc.text(`Rs ${paidAmount}`, 150, finalY + 20);

      doc.text("Total Due", 14, finalY + 30);
      doc.text(`Rs ${totalDue}`, 150, finalY + 30);
    }

    // *** Footer message - Centered, Bold, Larger Font ***
    const footerMessage = "Thank You. Come Again!";
    doc.setFontSize(16); // Increase font size
    doc.setFont("helvetica", "bold"); // Make it bold
    const footerMessageWidth = doc.getTextWidth(footerMessage); // Get text width
    doc.text(footerMessage, (pageWidth - footerMessageWidth) / 2, finalY + 50); // Center the text

    // Save the PDF
    doc.save(`Studio_Diya_Invoice_${selectedBooking?.orderId}.pdf`);
    setPdfGenerateLoading(false);
  };

  const loadImageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/png");
        resolve(dataURL);
      };
      img.onerror = (error) => reject(error);
      img.src = url;
    });
  };

  const handleFilterByDate = (e) => {
    setSearchKey(null);
    setCustomerDetail(null);
    setOrderDate(null);
    setStatus(null);
    const date = e.value ? e.value.toLocaleDateString("en-GB") : null;
    fetchBookings(null, date, null, null, null);
  };

  const handleFilterByOrderDate = (e) => {
    setSearchKey(null);
    setCustomerDetail(null);
    setBookingDate(null);
    setStatus(null);
    const date = e.value ? e.value.toLocaleDateString("en-GB") : null;
    fetchBookings(null, null, null, date, null);
  };

  const fetchBookings = async (
    bookingId,
    date,
    customerSearchQuery,
    orderDate,
    status
  ) => {
    setLoading(true);
    const data = await SampleData.getData(
      token,
      bookingId,
      date,
      customerSearchQuery,
      orderDate,
      status
    );
    setBookings(data.orders);
    setTotalRecords(data.totalRecords);
    const newRowPerPage = [5, 10, 25, 50].filter(
      (x) => x < Number(data.totalRecords)
    );
    setRowsPerPage([...newRowPerPage, Number(data.totalRecords)]);
    setLoading(false);
  };

  const changeOrderStatus = async (id) => {
    setChangeStatusLoading(true);
    try {
      const response = await api.patch(
        `/api/admin/change-order-status/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log(response.data);
      setSelectedBooking(response.data.order);
      fetchBookings(searchKey, bookingDate, customerDetail, orderDate);
      toast.current.show({
        severity: "success",
        summary: "Paid Status Changed!",
        detail: "Paid status has been changed",
        life: 3000,
      });
    } catch (err) {
      toast.current.show({
        severity: "error",
        summary: `Failed to change status`,
        detail: err.response.data.error,
        life: 3000,
      });
    } finally {
      setChangeStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(null, null, null, null, null);
  }, []);

  const onPageChange = (event) => {
    console.log(event);
    // setPage(event.page + 1);
    // setRows(event.rows);
  };

  const dateTimeTemplate = (rowData) => {
    return `${rowData.date} ${rowData.time}`;
  };

  const getSeverity = (booking) => {
    switch (booking.status) {
      case "Unpaid":
        return "warning"; // Yellow or Orange for unpaid status

      case "Paid":
        return "success"; // Green for fully paid

      case "Not Fully Paid":
        return "info"; // Light blue for partially paid

      case "Overpaid - Balance Due":
        return "primary"; // Blue for overpayment

      case "Balance Settled":
        return "secondary"; // Gray for balance settled

      default:
        return null;
    }
  };

  const statusBodyTemplate = (booking) => {
    return <Tag value={booking.status} severity={getSeverity(booking)}></Tag>;
  };

  const infoBodyTemplate = (rowData) => {
    return (
      <Button
        icon="bi bi-eye-fill"
        className="data-view-button"
        onClick={() => {
          setShowBookingModal(true);
          setSelectedBooking(rowData.details);
        }}
      />
    );
  };

  const bookingModalHeader = () => {
    return (
      <div className="modal-header p-2">
        <h1 className="modal-title fs-5" id="bookingDetailModalLabel">
          Order Info
        </h1>
        <button
          type="button"
          className="btn-close"
          onClick={() => setShowBookingModal(false)}
        ></button>
      </div>
    );
  };

  return (
    <>
      <Preloader />
      <div>
        <div className="page_header_area">
          <h4 className="page_heading">Orders</h4>
        </div>
        <Toast ref={toast} />
        <div className="filter_area">
          <div className="row">
            <div className="col-12 col-xl-4 col-sm-6">
              <div className="custom-form-group mb-sm-0 mb-3">
                <label htmlFor="bookingDate" className="custom-form-label">
                  Filter by invoice created date :{" "}
                </label>
                <div className="form-icon-group">
                  <i className="bi bi-calendar2-fill input-grp-icon"></i>
                  <Calendar
                    id="bookingDate"
                    onFocus={() => {
                      setBookingDate(null);
                      fetchBookings(
                        searchKey,
                        null,
                        customerDetail,
                        orderDate
                          ? orderDate.toLocaleDateString("en-GB")
                          : null,
                        status
                      );
                    }}
                    value={bookingDate}
                    onChange={(e) => {
                      setBookingDate(e.value);
                      handleFilterByDate(e);
                    }}
                    placeholder="dd/mm/yyyy"
                    dateFormat="dd/mm/yy"
                    maxDate={today}
                    className="w-100"
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4 col-sm-6">
              <div className="custom-form-group mb-sm-0 mb-3">
                <label htmlFor="dropOffDate" className="custom-form-label">
                  Search by order id :{" "}
                </label>
                <div className="form-icon-group">
                  <i className="bi bi-search input-grp-icon"></i>
                  <InputText
                    id="searchKey"
                    className="custom-form-input"
                    name="searchKey"
                    placeholder="Search here.."
                    value={searchKey}
                    defaultValue={searchKey}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchKey(value);
                      const bookingId = value ? value : null;
                      setBookingDate(null);
                      setCustomerDetail(null);
                      setOrderDate(null);
                      setStatus(null);
                      fetchBookings(bookingId, null, null, null, null);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="col-12 col-xl-4 col-sm-6">
              <div className="custom-form-group mb-sm-0 mb-3">
                <label htmlFor="dropOffDate" className="custom-form-label">
                  Search by customer detail :{" "}
                </label>
                <div className="form-icon-group">
                  <i className="bi bi-search input-grp-icon"></i>
                  <InputText
                    id="searchKey"
                    className="custom-form-input"
                    name="searchKey"
                    placeholder="Name or Mobile number.."
                    value={customerDetail}
                    defaultValue={customerDetail}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomerDetail(value);
                      const customerDetailQuery = value ? value : null;
                      setSearchKey(null);
                      setBookingDate(null);
                      setOrderDate(null);
                      setStatus(null);
                      fetchBookings(
                        null,
                        null,
                        customerDetailQuery,
                        null,
                        null
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12 col-xl-4 col-sm-6">
              <div className="custom-form-group mb-sm-0 mb-3">
                <label htmlFor="bookingDate" className="custom-form-label">
                  Filter by order date/function date :{" "}
                </label>
                <div className="form-icon-group">
                  <i className="bi bi-calendar2-fill input-grp-icon"></i>
                  <Calendar
                    id="orderDate"
                    onFocus={() => {
                      setOrderDate(null);
                      fetchBookings(searchKey, (bookingDate ? bookingDate.toLocaleDateString("en-GB"): null), customerDetail, null, status);
                    }}
                    value={orderDate}
                    onChange={(e) => {
                      setOrderDate(e.value);
                      handleFilterByOrderDate(e);
                    }}
                    placeholder="dd/mm/yyyy"
                    dateFormat="dd/mm/yy"
                    className="w-100"
                  />
                </div>
              </div>
            </div>
            <div className="col-12 col-xl-4 col-sm-6">
              <div className="custom-form-group mb-sm-0 mb-3">
                <label htmlFor="bookingDate" className="custom-form-label">
                  Filter by invoice status :{" "}
                </label>
                <div className="form-icon-group">
                  <i className="bi bi-info-circle-fill input-grp-icon"></i>
                  <Dropdown
                    id="status"
                    className="w-full w-100 custom-form-dropdown"
                    placeholder="Select invoice status."
                    value={status}
                    name="status"
                    options={[
                      "Paid", // Fully paid, no balance due
                      "Unpaid", // No amount paid yet
                      "Not Fully Paid", // Partial payment made, but not the total amount
                      "Overpaid - Balance Due", // Paid more than the total amount, balance needs to be refunded
                      "Balance Settled", // Overpayment balance has been refunded or adjusted
                    ]}
                    optionLabel="status"
                    onChange={(event) => {
                      setStatus(event.value);
                      setBookingDate(null);
                      setSearchKey(null);
                      setCustomerDetail(null);
                      setOrderDate(null);
                      fetchBookings(null, null, null, null, event.value);
                    }}
                    filter
                    showClear={status ? true : false}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="page_content">
          {bookings && bookings?.length > 0 && (
            <div className="dash-table-area">
              <DataTable
                value={bookings}
                paginator
                size="small"
                rows={rows}
                totalRecords={totalRecords}
                // onPage={onPageChange}
                loading={loading}
                rowsPerPageOptions={rowPerPage}
                tableStyle={{ minWidth: "50rem" }}
                rowHover
                className="dash-table"
              >
                <Column
                  header="Order ID"
                  field="id"
                  style={{ width: "20%" }}
                ></Column>
                <Column
                  header="Created Date & Time"
                  body={dateTimeTemplate}
                  style={{ width: "30%" }}
                ></Column>
                <Column
                  header="Status"
                  body={statusBodyTemplate}
                  style={{ width: "25%" }}
                ></Column>
                <Column
                  header="Order date/function date"
                  body={(rowData) => {
                    return `${rowData.orderDate || ''}`;
                  }}
                  style={{ width: "30%" }}
                ></Column>
                <Column
                  header="Ordered By"
                  field="orderedBy"
                  style={{ width: "20%" }}
                ></Column>
                <Column
                  body={infoBodyTemplate}
                  header="Full details"
                  style={{ width: "10%" }}
                ></Column>
              </DataTable>
            </div>
          )}
          {loading && (
            <div className="no_data_found_area">
              {/* <img src="/assets/images/no_data_2.svg" alt="No booking data!" /> */}
              <h6>Loading...</h6>
            </div>
          )}
          {!loading && bookings && bookings?.length === 0 && (
            <div className="no_data_found_area">
              <img src="/assets/images/no_data_2.svg" alt="No order data!" />
              <h6>No Order data!</h6>
            </div>
          )}
        </div>
      </div>

      {/* Booking view modal */}
      {selectedBooking && (
        <Dialog
          header={bookingModalHeader}
          visible={showBookingModal}
          onHide={() => {
            if (!showBookingModal) return;
            setShowBookingModal(false);
          }}
          className="custom-modal modal_dialog modal_dialog_md"
        >
          <div className="modal-body p-2">
            <div className="data-view-area">
              <h5 className="data-view-head">Invoice Details</h5>
              <div className="data-view-sub mt-3">
                <div className="row">
                  <div className="col-12 col-lg-6">
                    <div className="data-view mb-3">
                      <h6 className="data-view-title">Order Id :</h6>
                      <h6 className="data-view-data">
                        {selectedBooking?.orderId}
                      </h6>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6">
                    <div className="data-view mb-3">
                      <h6 className="data-view-title">Paid Status :</h6>
                      <h6 className="data-view-data">
                        {selectedBooking.status}
                      </h6>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6">
                    <div className="data-view mb-0">
                      <h6 className="data-view-title">Total :</h6>
                      <h6 className="data-view-data">
                        Rs {selectedBooking.total}
                      </h6>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6">
                    <div className="data-view mb-0">
                      <h6 className="data-view-title">Paid Amount :</h6>
                      <h6 className="data-view-data">
                        Rs {selectedBooking.paidAmount}
                      </h6>
                    </div>
                  </div>
                </div>
              </div>
              {["Overpaid - Balance Due", "Balance Settled"].includes(
                selectedBooking.status
              ) && (
                <Button
                  label="Change Paid Status"
                  severity="danger"
                  loading={changeStatusLoading}
                  onClick={() => {
                    changeOrderStatus(selectedBooking._id);
                  }}
                  className="mt-3 ml-2 mx-2"
                />
              )}
              <Divider className="mt-4 mb-4" />
              <h5 className="data-view-head">Order Type Details</h5>
              {selectedBooking.orderDetails.map((order, index) => (
                <div key={index} className="data-view-sub mt-3">
                  <h6 className="data-view-sub-head">Order Type {index + 1}</h6>
                  <div className="row">
                    <div className="col-12 col-lg-6">
                      <div className="data-view mb-3">
                        <h6 className="data-view-title">Description :</h6>
                        <h6 className="data-view-data">{order.orderType}</h6>
                      </div>
                    </div>
                    <div className="col-12 col-lg-6">
                      <div className="data-view mb-3">
                        <h6 className="data-view-title">Unit Price :</h6>
                        <h6 className="data-view-data">{order.unitPrice}</h6>
                      </div>
                    </div>
                    <div className="col-12 col-lg-6">
                      <div className="data-view mb-3 mb-lg-0">
                        <h6 className="data-view-title">quantity :</h6>
                        <h6 className="data-view-data">
                          {order.quantity || "-"}
                        </h6>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Divider className="mt-4 mb-4" />
              <h5 className="data-view-head">Customer Details</h5>
              <div className="row mt-4">
                <div className="col-12 col-lg-6">
                  <div className="data-view mb-3">
                    <h6 className="data-view-title">Name :</h6>
                    <h6 className="data-view-data">
                      {selectedBooking.customerDetails.name}
                    </h6>
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="data-view mb-0">
                    <h6 className="data-view-title">Mobile Number :</h6>
                    <h6 className="data-view-data">
                      {selectedBooking.customerDetails.mobileNumber}
                    </h6>
                  </div>
                </div>
              </div>
            </div>
            <div className="row mt-3">
              {/* <div className="custom-form-group mb-3 mb-sm-4">
                <label htmlFor="orderType" className="custom-form-label">
                  Paid Amount
                </label>
                <InputText
                  id="paidAmount"
                  className="custom-form-input"
                  placeholder="Enter Paid amount"
                  name="paidAmount"
                  keyfilter="num"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div> */}
              <div className="d-flex">
                <div className="ext-end">
                  <Button
                    label="Export as PDF"
                    icon="bi bi-filetype-pdf"
                    className="btn_primary"
                    loading={pdfGeneatorLoading}
                    // disabled={!paidAmount}
                    onClick={exportToPDF}
                  />
                </div>
                <Button
                  label="Edit Order"
                  className="mx-2"
                  onClick={() => {
                    navigate("/edit-order", {
                      state: { order: selectedBooking },
                    });
                  }}
                />
              </div>
            </div>
          </div>
        </Dialog>
      )}
      {/*  */}
    </>
  );
};

export default Bookings;
