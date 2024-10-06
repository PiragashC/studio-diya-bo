import React, { useState, useEffect, useRef } from "react";
import Preloader from "../../Preloader";

import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Toast } from "primereact/toast";
import { Divider } from "primereact/divider";

import { SampleData } from "../../UserData";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../api";
import { Tag } from "primereact/tag";
import { InputTextarea } from "primereact/inputtextarea";

const Customers = () => {
  const toast = useRef(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [rows, setRows] = useState(10);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [customerData, setCustomerData] = useState(null);
  const [rowPerPage, setRowsPerPage] = useState([5]);
  const token = useSelector((state) => state.auth.token);
  const [orderTypeModalState, setOrderTypeModalState] = useState("");
  const [showAddDataModal, setShowAddDataModal] = useState(false);
  const initialCreatingOrderTypeDetails = {
    orderType: "",
    unitPrice: "",
    id: "",
  };
  const [creatingOrderTypeDetail, setCreatingOrderTypeDetail] = useState(
    initialCreatingOrderTypeDetails
  );
  const [loadingNew, setLoadingNew] = useState(false);
  const [showAddError, setShowAddError] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    const data = await SampleData.getData("User", token);
    setCustomerData(data.orderTypes);
    setTotalRecords(data.totalRecords);
    const newRowPerPage = [5, 10, 25, 50].filter(
      (x) => x < Number(data.totalRecords)
    );
    setRowsPerPage([...newRowPerPage, Number(data.totalRecords)]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

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
          `/api/admin/update-order-type/${creatingOrderTypeDetail.id || creatingOrderTypeDetail._id}`,
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
      setCreatingOrderTypeDetail(initialCreatingOrderTypeDetails);
      setOrderTypeModalState("");
      setShowAddDataModal(false);
      fetchCustomers();
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

  const handleDeleteCustomer = (id) => {
    confirmDialog({
      message: `Are you sure you want to delete?`,
      header: "Order Type Delete Confirmation",
      icon: "bi bi-info-circle",
      defaultFocus: "reject",
      acceptClassName: "p-button-danger",
      accept: () => {
        deleteCustomer(id);
      },
    });
  };

  const deleteCustomer = async (id) => {
    try {
      const response = await api.delete(`/api/admin/delete-order-type/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      toast.current?.show({
        severity: "success",
        summary: "Order Type Deleted Successfully!",
        detail: response.data.message,
        life: 3000,
      });
      fetchCustomers();
    } catch (err) {
      console.log(err);
      toast.current?.show({
        severity: "error",
        summary: "Error!",
        detail: err.response.data.error,
        life: 3000,
      });
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="action_btn_area">
        <Tag
          style={{ cursor: "pointer" }}
          value="DELETE"
          severity="danger"
          onClick={() => handleDeleteCustomer(rowData?.id)}
        />
        <Tag
          style={{ cursor: "pointer" }}
          value="EDIT"
          severity="success"
          onClick={() => {
            setOrderTypeModalState("Update");
            setShowAddDataModal(true);
            setCreatingOrderTypeDetail(rowData?.details);
          }}
        />
      </div>
    );
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

  const handleCreatingOrderTypeDetailInputs = (e) => {
    const { name, value } = e.target;
    setCreatingOrderTypeDetail({
      ...creatingOrderTypeDetail,
      [name]: value,
    });
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

  return (
    <>
      <Preloader />
      <Toast ref={toast} />
      <div>
        <div className="page_header_area">
          <h4 className="page_heading">Order Types</h4>
          <div className="px-5 mt-3">
            <Button
            severity="info"
              label="+ CREATE"
              onClick={() => {
                setOrderTypeModalState("Create");
                setShowAddDataModal(true);
              }}
            />
          </div>
        </div>

        <div className="page_content">
          {customerData?.length > 0 && (
            <div className="dash-table-area">
              <DataTable
                loading={loading}
                value={customerData}
                paginator
                size="small"
                rows={rows}
                totalRecords={totalRecords}
                // onPage={onPageChange}
                rowsPerPageOptions={rowPerPage}
                tableStyle={{ minWidth: "50rem" }}
                rowHover
                className="dash-table"
              >
                <Column
                  header="No."
                  field="no"
                  style={{ width: "10%" }}
                ></Column>

                <Column
                  header="Order Type"
                  field="orderType"
                  style={{ width: "20%" }}
                ></Column>

                <Column
                  header="Unit Price"
                  field="unitPrice"
                  style={{ width: "20%" }}
                ></Column>

                <Column
                  body={actionBodyTemplate}
                  alignHeader={"center"}
                  className=""
                  header="Action"
                  style={{ width: "15%" }}
                ></Column>
              </DataTable>
            </div>
          )}

          {loading && (
            <div className="no_data_found_area">
              <h6>Loading...</h6>
            </div>
          )}

          {!loading && customerData && customerData?.length === 0 && (
            <div className="no_data_found_area">
              <img
                src="/assets/images/no_data_2.svg"
                alt="No order types data!"
              />
              <h6>No order types data!</h6>
            </div>
          )}
        </div>
      </div>

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
    </>
  );
};

export default Customers;
