import api from "./api";

export const SampleData = {
  getData(type, token) {
    return api
      .get(`/api/admin/get-order-type`, {
        // params: {
        //     type
        // },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      .then((res) => {
        console.log(res.data.data)
        // Transform the response data to match the structure required by the DataTable
        const orderTypes = res.data.data.map((ot, index) => ({
          no: index+1,
          orderType: ot.orderType,
          unitPrice: "Rs "+ot.unitPrice,
          id: ot._id,
          details:ot
        }));
        return { orderTypes, totalRecords: res.data.totalCount };
      })
      .catch((err) => {
        console.error(err);
        return { orderTypes: [], totalRecords: 0 };
      });
  },

  // The other functions can remain the same
  getBookingsSmall(token) {
    return this.getData(1, 10, "", "", token);
  },

  getBookingsMedium(token) {
    return this.getData(1, 50, "", "", token);
  },

  getBookingsLarge(token) {
    return this.getData(1, 200, "", "", token);
  },

  getBookingsXLarge(token) {
    return this.getData(undefined, undefined, "", "", token);
  },

  getBookings(params, token) {
    const queryParams = params
      ? Object.keys(params)
          .map(
            (k) => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])
          )
          .join("&")
      : "";

    return fetch(
      `https://www.primefaces.org/data/bookings?${queryParams}`
    ).then((res) => res.json());
  },
};
