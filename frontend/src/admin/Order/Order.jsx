import React, { useEffect, useState, useRef } from "react";
import "./Order.css";
import Preloader from "../../Preloader";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Ripple } from "primereact/ripple";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import api from "../../api";
import { useSelector } from "react-redux";
import { Checkbox } from "primereact/checkbox";
import { useLocation } from "react-router-dom";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";

const Order = () => {
  const toast = useRef(null);
  const { pathname, state } = useLocation();
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingNew, setLoadingNew] = useState(false);
  const [totalLoading, setTotalLoading] = useState(false);
  const [orderTypes, setOrderTypes] = useState([]);
  const token = useSelector((state) => state.auth.token);
  const [duplicateOrderSelectIndex, setDuplicateOrderSelectIndex] =
    useState(null);
  const initalCustomerDetails = {
    name: "",
    mobileNumber: "",
  };
  const [customerDetails, setCustomerDetails] = useState(initalCustomerDetails);
  const initialOrderDetails = [
    {
      orderType: "",
      unitPrice: "",
      quantity: "",
      id: "",
    },
  ];
  const [orderDetails, setOrderDetails] = useState(initialOrderDetails);
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const initialCreatingOrderTypeDetails = {
    orderType: "",
    unitPrice: "",
    id: "",
  };
  const [creatingOrderTypeDetail, setCreatingOrderTypeDetail] = useState(
    initialCreatingOrderTypeDetails
  );
  const [status, setStatus] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [showAddError, setShowAddError] = useState(false);
  const [orderTypeModalState, setOrderTypeModalState] = useState("");
  const [fetchTrigerForTotalAmount, setFetchTrigerForTotalAmount] =
    useState(false);
  const [paidAmount, setPaidAmount] = useState("");
  const [orderDate, setOrderDate] = useState("");

  const handleCreatingOrderTypeDetailInputs = (e) => {
    const { name, value } = e.target;
    setCreatingOrderTypeDetail({
      ...creatingOrderTypeDetail,
      [name]: value,
    });
  };

  const handleCustomerInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails({
      ...customerDetails,
      [name]: value,
    });
  };

  const handleInputOrderDetailChange = (index, event) => {
    setDuplicateOrderSelectIndex(null);
    const { name, value } = event.target;

    setOrderDetails((prevDetails) => {
      // Check if the name is "orderType" and if the id already exists
      if (name === "orderType") {
        const existingOrder = prevDetails.find(
          (order, i) => i !== index && order.id === value?.id
        );

        if (existingOrder) {
          setDuplicateOrderSelectIndex(index);
          return prevDetails;
        }

        // If no conflict, proceed with updating the order
        return prevDetails.map((order, i) => {
          if (i === index) {
            return {
              ...order,
              id: value?.id || "",
              orderType: value?.orderType || "",
              unitPrice: value?.unitPrice || "",
            };
          }
          return order;
        });
      }

      // Default case for other input fields
      return prevDetails.map((order, i) => {
        if (i === index) {
          return {
            ...order,
            [name]: value,
          };
        }
        return order;
      });
    });

    setFetchTrigerForTotalAmount(!fetchTrigerForTotalAmount);
  };

  function validateUserDetails(userDetails) {
    if (!userDetails.name || !userDetails.mobileNumber) {
      setShowError(true);
      toast.current.show({
        severity: "error",
        summary: "Error in Customer Details Submission",
        detail: "Please fill all required fields!",
        life: 3000,
      });
      return false;
    }
    return true;
  }

  const fetchOrderTypes = async () => {
    try {
      const response = await api.get("/api/admin/get-order-type", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      console.log(response.data);
      setOrderTypes(
        response.data?.data?.map((ot) => {
          return {
            orderType: ot.orderType,
            unitPrice: ot.unitPrice,
            id: ot._id,
          };
        })
      );
    } catch (err) {
      console.log(err);
    }
  };

  const handleOrder = async (details) => {
    setLoading(true);
    try {
      const endpoint = state?.order
        ? `/api/admin/update-order/${state.order._id}`
        : "/api/admin/create-order";

      const method = state?.order ? "put" : "post";

      const response = await api[method](endpoint, details, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(response.data);

      toast.current.show({
        severity: "success",
        summary: state?.order
          ? "Order Updated Successfully"
          : "Order Created Successfully",
        detail: state?.order
          ? "Order updated successfully!"
          : "New order for a customer created successfully! Generate its invoice under the Invoice section.",
        life: 3000,
      });

      setCustomerDetails(initalCustomerDetails);
      setOrderDetails(initialOrderDetails);
      setPaidAmount("");
      setStatus(false);
      setTotalAmount(0);
      setOrderDate('');
    } catch (err) {
      console.log(err);
      toast.current.show({
        severity: "error",
        summary: state?.order
          ? "Failed to Update Order"
          : "Failed to Create an Order",
        detail: err.response.data.error,
        life: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderType = async (details) => {
    setLoadingNew(true);
    try {
      let response;

      if (orderTypeModalState === "Create") {
        response = await api.post("/api/admin/create-order-type", details, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        toast.current.show({
          severity: "success",
          summary: "New Order Type Created Successfully!",
          detail:
            "New order type for creating orders successfully created in your database",
          life: 3000,
        });
      } else if (orderTypeModalState === "Update") {
        response = await api.put(
          `/api/admin/update-order-type/${creatingOrderTypeDetail.id}`,
          details,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        toast.current.show({
          severity: "success",
          summary: "Order Type Detail Updated Successfully!",
          detail:
            "Order type for creating orders successfully updated in your database",
          life: 3000,
        });
      }

      console.log(response.data);
      if (orderTypeModalState === "Update") {
        const correspondingSelectedOrderDetail = orderDetails.find(
          (od) => od.id === response.data?.orderType?._id
        );
        if (correspondingSelectedOrderDetail) {
          setOrderDetails((prevDetails) =>
            prevDetails.map((od) =>
              od.id === response.data?.orderType?._id
                ? {
                    ...od,
                    orderType: response.data?.orderType?.orderType,
                    unitPrice: response.data?.orderType?.unitPrice,
                  }
                : od
            )
          );
        }
      }

      setCreatingOrderTypeDetail(initialCreatingOrderTypeDetails);
      setOrderTypeModalState("");
      setShowAddDataModal(false);
      fetchOrderTypes();
    } catch (err) {
      console.log(err);
      toast.current.show({
        severity: "error",
        summary: `Failed to ${orderTypeModalState} an Order Type`,
        detail: err.response.data.error,
        life: 3000,
      });
    } finally {
      setLoadingNew(false);
    }
  };

  const handleCreateOrder = () => {
    setShowError(false);
    if (!validateUserDetails(customerDetails)) {
      return;
    }

    const hasError = orderDetails.some(
      (order) => !order.orderType || !order.unitPrice || !order.quantity
    );
    if (hasError) {
      setShowError(true);
      toast.current.show({
        severity: "error",
        summary: "Error in Order Detail Submission",
        detail: "Please fill all required fields!",
        life: 3000,
      });
      return;
    }

    if (!paidAmount && paidAmount !== 0) {
      setShowError(true);
      toast.current.show({
        severity: "error",
        summary: "Error in Paid amount Submission",
        detail: "Please fill all required fields!",
        life: 3000,
      });
      return;
    }

    const orderDetailsForInvoice = {
      customerDetails,
      orderDetails: orderDetails.map((od) => {
        return { id: od.id, quantity: od.quantity };
      }),
      paidAmount,
      orderDate: orderDate.toLocaleDateString("en-GB"),
    };
    handleOrder(orderDetailsForInvoice);
  };

  const addOrder = () => {
    setOrderDetails([...orderDetails, initialOrderDetails[0]]);
  };

  const removeOrder = (index) => {
    const newOrderDetails = orderDetails.filter((_, i) => i !== index);
    setOrderDetails(newOrderDetails);
    setFetchTrigerForTotalAmount(!fetchTrigerForTotalAmount);
  };

  const handleCreateOrderTypes = () => {
    setShowAddError(false);

    if (
      !creatingOrderTypeDetail.orderType ||
      !creatingOrderTypeDetail.unitPrice
    ) {
      setShowAddError(true);
      toast.current.show({
        severity: "error",
        summary: "Error in Order Type Submission",
        detail: "Please fill all required fields!",
        life: 3000,
      });
      return;
    }

    if (orderTypeModalState === "Create" || orderTypeModalState === "Update") {
      handleOrderType(creatingOrderTypeDetail);
    } else {
      return;
    }
  };

  const addDataModalHeader = () => {
    return (
      <div className="modal-header p-2">
        <h1 className="modal-title fs-5">{orderTypeModalState} order type</h1>
        <button
          type="button"
          className="btn-close"
          onClick={() => {
            setShowAddDataModal(false);
            setCreatingOrderTypeDetail(initialCreatingOrderTypeDetails);
            setOrderTypeModalState("");
          }}
        ></button>
      </div>
    );
  };

  const addDataModalFooter = () => {
    return (
      <div className="custom_modal_footer p-2">
        <Button
          label="Cancel"
          severity="secondary"
          className="modal_btn"
          onClick={() => {
            setShowAddDataModal(false);
            setCreatingOrderTypeDetail(initialCreatingOrderTypeDetails);
            setOrderTypeModalState("");
          }}
        />
        <Button
          label={loadingNew ? "Processing" : orderTypeModalState}
          className="submit-button modal_btn"
          loading={loadingNew}
          onClick={handleCreateOrderTypes}
        />
      </div>
    );
  };

  const getTotalAmount = async () => {
    setTotalLoading(true);
    const orderItems = orderDetails.map((od) => {
      return {
        id: od.id,
        quantity: od.quantity,
      };
    });

    try {
      const response = await api.get("/api/admin/get-total-amount", {
        params: {
          orderItems: JSON.stringify(orderItems),
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setTotalAmount(response.data.totalAmount);
    } catch (err) {
      console.error(err);
      setTotalAmount(0);
    } finally {
      setTotalLoading(false);
    }
  };

  const reverseDate = (dateString) => {
    // Split the date string into parts [dd, mm, yyyy]
    const [day, month, year] = dateString.split("/");

    // Rearrange to yyyy-mm-dd format
    const formattedDate = `${year}-${month}-${day}`;

    // Create and return a new Date object
    return new Date(formattedDate);
  };

  useEffect(() => {
    fetchOrderTypes();
  }, []);

  useEffect(() => {
    getTotalAmount();
  }, [fetchTrigerForTotalAmount]);

  useEffect(() => {
    if (pathname === "/new-order" && !state) {
      setCustomerDetails(initalCustomerDetails);
      setOrderDetails(initialOrderDetails);
      setPaidAmount("");
      setTotalAmount(0);
      setStatus(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (state && state?.order && orderTypes.length > 0) {
      const updatingCusDetail = state?.order?.customerDetails;
      const updatingOrderDetails = state?.order?.orderDetails
        .map((uod) => {
          const foundOrderType = orderTypes.find((ot) => ot.id === uod.id);

          if (foundOrderType) {
            return {
              ...foundOrderType,
              quantity: uod.quantity,
            };
          }

          return null; // Return null if foundOrderType is not found
        })
        .filter((uod) => uod !== null); // Filter out null values
      console.log(state?.order?.orderDetails);
      setOrderDetails(updatingOrderDetails);
      setCustomerDetails(updatingCusDetail);
      setPaidAmount(state?.order?.paidAmount);
      setTotalAmount(state?.order?.total);
      setOrderDate(
        state?.order?.orderDate && reverseDate(state?.order?.orderDate)
      );
    }
  }, [state, orderTypes]);

  return (
    <>
      <Preloader />
      <div>
        <div className="page_header_area">
          <h4 className="page_heading">
            {state?.order ? "Update" : "New"} Order
          </h4>
        </div>
        <Toast ref={toast} />

        <div className="filter_area">
          <h6 className="section_part_heading">Customer details</h6>

          <div className="row">
            <div className="col-12 col-xl-4 col-sm-6">
              <div className="custom-form-group mb-sm-4 mb-3">
                <label
                  htmlFor="name"
                  className="custom-form-label form-required"
                >
                  Name:{" "}
                </label>
                <InputText
                  id="name"
                  className="custom-form-input"
                  placeholder="Enter Name"
                  invalid={showError}
                  value={customerDetails.name}
                  name="name"
                  onChange={handleCustomerInputChange}
                />
                {showError && !customerDetails.name && (
                  <small className="text-danger form-error-msg">
                    This field is required
                  </small>
                )}
              </div>
            </div>

            <div className="col-12 col-xl-4 col-sm-6">
              <div className="custom-form-group mb-sm-4 mb-xl-0 mb-3">
                <label
                  htmlFor="mobileNumber"
                  className="custom-form-label form-required"
                >
                  Mobile Number:{" "}
                </label>
                <InputText
                  id="mobileNumber"
                  className="custom-form-input"
                  placeholder="Enter Mobile Number"
                  invalid={showError}
                  value={customerDetails.mobileNumber}
                  name="mobileNumber"
                  keyfilter="num"
                  onChange={handleCustomerInputChange}
                />
                {showError && !customerDetails.mobileNumber && (
                  <small className="text-danger form-error-msg">
                    This field is required
                  </small>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="filter_area">
          <h6 className="section_part_heading">Order details</h6>

          {orderDetails.map((order, index) => (
            <div className="row">
              <div className="col-12 col-xl-4 col-sm-6">
                <div className="custom-form-group mb-sm-4 mb-3">
                  <label
                    htmlFor={`orderType-${index}`}
                    className="custom-form-label form-required"
                  >
                    Order Type:{" "}
                  </label>
                  <Dropdown
                    id={`orderType-${index}`}
                    className="w-full w-100 custom-form-dropdown"
                    placeholder="Select Order Type."
                    invalid={showError}
                    value={{
                      id: order.id,
                      orderType: order.orderType,
                      unitPrice: order.unitPrice,
                    }}
                    name="orderType"
                    options={orderTypes}
                    optionLabel="orderType"
                    onChange={(event) =>
                      handleInputOrderDetailChange(index, event)
                    }
                    filter
                    showClear={order.orderType ? true : false}
                  />
                  {showError && !order.orderType && (
                    <small className="text-danger form-error-msg">
                      This field is required
                    </small>
                  )}
                  {duplicateOrderSelectIndex === index && (
                    <small className="text-danger form-error-msg">
                      This order type already selected updated the quantity
                      field instead of duplicate
                    </small>
                  )}
                </div>
              </div>

              <div className="col-12 col-xl-4 col-sm-6">
                <div className="custom-form-group mb-sm-4 mb-3">
                  <label
                    htmlFor={`unitPrice-${index}`}
                    className="custom-form-label form-required"
                  >
                    Unit Price:{" "}
                  </label>
                  <InputText
                    id={`unitPrice-${index}`}
                    className="custom-form-input"
                    placeholder="Unit Price"
                    invalid={showError}
                    value={order.unitPrice}
                    name="unitPrice"
                    keyfilter="num"
                    readOnly
                  />
                  {showError && !order.unitPrice && (
                    <small className="text-danger form-error-msg">
                      This field is required
                    </small>
                  )}
                </div>
              </div>

              <div className="col-12 col-xl-4 col-sm-6">
                <div className="custom-form-group mb-sm-4 mb-3">
                  <label
                    htmlFor={`quantity-${index}`}
                    className="custom-form-label form-required"
                  >
                    Quantity:{" "}
                  </label>
                  <InputText
                    id={`quantity-${index}`}
                    className="custom-form-input"
                    placeholder="Enter Quantity"
                    invalid={showError}
                    value={order.quantity}
                    name="quantity"
                    onChange={(event) =>
                      handleInputOrderDetailChange(index, event)
                    }
                    keyfilter="num"
                  />
                  {showError && !order.quantity && (
                    <small className="text-danger form-error-msg">
                      This field is required
                    </small>
                  )}
                </div>
              </div>

              <div className="col-12 mb-sm-4 mb-3">
                <Button
                  label="Add Order"
                  className="aply-btn mt-3"
                  onClick={addOrder}
                />
                {index !== 0 && (
                  <Button
                    label="Remove Order"
                    severity="danger"
                    onClick={() => removeOrder(index)}
                    className="mt-3 ml-2 mx-2"
                  />
                )}
                <Button
                  label="Edit Order Type"
                  className="mt-3 ml-2 mx-2"
                  onClick={() => {
                    setCreatingOrderTypeDetail({
                      orderType: order.orderType,
                      unitPrice: order.unitPrice,
                      id: order.id,
                    });
                    setOrderTypeModalState("Update");
                    setShowAddDataModal(true);
                  }}
                  disabled={!order.orderType || !order.unitPrice}
                />
              </div>
            </div>
          ))}

          <button
            className="add_data_btn p-ripple"
            onClick={() => {
              setOrderTypeModalState("Create");
              setShowAddDataModal(true);
            }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Create new order type
            <Ripple />
          </button>
        </div>

        <div className="filter_area">
          <div className="row">
            <div className="col-12 col-xl-4 col-sm-6">
              <div className="custom-form-group mb-sm-4 mb-3">
                <label
                  htmlFor="paidAmount"
                  className="custom-form-label form-required"
                >
                  Paid Amount:{" "}
                </label>
                <InputText
                  id="paidAmount"
                  className="custom-form-input"
                  placeholder="Enter paid amount"
                  invalid={showError}
                  value={paidAmount}
                  name="quantity"
                  onChange={(event) => setPaidAmount(event.target.value)}
                  keyfilter="num"
                />
                {showError && !paidAmount && paidAmount !== 0 && (
                  <small className="text-danger form-error-msg">
                    This field is required
                  </small>
                )}
              </div>
            </div>

            <div className="col-12 col-xl-4 col-sm-6">
              <div className="custom-form-group mb-sm-4 mb-3">
                <label
                  htmlFor="orderDate"
                  className="custom-form-label form-required"
                >
                  Order Date/Function Date:{" "}
                </label>
                <Calendar
                  id="orderDate"
                  value={orderDate}
                  onChange={(e) => {
                    setOrderDate(e.value);
                  }}
                  placeholder="dd/mm/yyyy"
                  dateFormat="dd/mm/yy"
                  invalid={showError}
                  className="w-100"
                />
                {showError && !orderDate && (
                  <small className="text-danger form-error-msg">
                    This field is required
                  </small>
                )}
              </div>
            </div>

            <div className="col-12">
              <div className="total-price-area">
                <h5 className="total-price-text">Total :</h5>
                <h5 className="total-price">
                  {" "}
                  {totalLoading
                    ? "calculating..."
                    : totalAmount
                    ? "Rs " + totalAmount
                    : "Rs 0"}
                </h5>
              </div>
            </div>
          </div>
        </div>

        <div className="text-end mt-4 pb-5">
          <Button
            label={state?.order ? "UPDATE ORDER" : "CREATE ORDER"}
            className="aply-btn"
            loading={loading}
            onClick={handleCreateOrder}
          />
        </div>
      </div>

      {/* User create/edit modal */}
      <Dialog
        header={addDataModalHeader}
        footer={addDataModalFooter}
        visible={showAddDataModal}
        onHide={() => {
          if (!showAddDataModal) return;
          setShowAddDataModal(false);
        }}
        className="custom-modal modal_dialog modal_dialog_sm"
      >
        <div className="modal-body p-2">
          <div className="data-view-area">
            <div className="row mt-sm-2">
              <div className="col-12">
                <div className="custom-form-group mb-3 mb-sm-4">
                  <label
                    htmlFor="orderType"
                    className="custom-form-label form-required"
                  >
                    Order Type
                  </label>
                  <InputTextarea
                    id="orderType"
                    className="custom-form-input"
                    placeholder="Enter Order type"
                    name="orderType"
                    value={creatingOrderTypeDetail.orderType}
                    onChange={handleCreatingOrderTypeDetailInputs}
                  />

                  {showAddError && !creatingOrderTypeDetail.orderType && (
                    <small className="text-danger form-error-msg">
                      This field is required
                    </small>
                  )}
                </div>
                <div className="custom-form-group mb-3 mb-sm-4">
                  <label
                    htmlFor="unitPrice"
                    className="custom-form-label form-required"
                  >
                    Unit Price
                  </label>
                  <InputText
                    id="unitPrice"
                    className="custom-form-input"
                    placeholder="Enter Unit Price"
                    name="unitPrice"
                    value={creatingOrderTypeDetail.unitPrice}
                    onChange={handleCreatingOrderTypeDetailInputs}
                    keyfilter="num"
                  />

                  {showAddError && !creatingOrderTypeDetail.unitPrice && (
                    <small className="text-danger form-error-msg">
                      This field is required
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
      {/*  */}
    </>
  );
};

export default Order;
