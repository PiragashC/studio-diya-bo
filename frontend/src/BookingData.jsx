import api from "./api";

export const SampleData = {
    getData(token, orderId, date, customerDetail) {
        return api.get(`/api/common-role/get-all-bookings`, {
            params: {
                ...(orderId && {orderId}),
                ...(date && {date}),
                ...(customerDetail && {customerDetail}),
            },
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        }).then(res => {
            // Transform the response data to match the structure required by the DataTable
            const orders = res.data.data.map(order => ({
                id: order.orderId,
                date: new Date(order.createdAt).toLocaleDateString('en-GB'),
                time: new Date(order.createdAt).toLocaleTimeString(),
                status: order.status,
                orderedBy: order?.customerDetails?.name,
                details: order,
            }));
    
            // Add empty dummy objects based on remainingDataCount
            // const dummyBookings = Array(res.data.remainingDataCount).fill({
            //     id: null,
            //     date: '',
            //     time: '',
            //     status: '',
            //     details: {},
            // });
    
            // Combine the real bookings with the dummy ones
            // const allBookings = [...bookings, ...dummyBookings];
    
            return { orders, totalRecords: res.data.totalCount };
        }).catch(err => {
            console.error(err);
            return { orders: [], totalRecords: 0 };
        });
    },

    // The other functions can remain the same
    getBookingsSmall(token) {
        return this.getData(1, 10, '', '', token);
    },

    getBookingsMedium(token) {
        return this.getData(1, 50, '', '', token);
    },

    getBookingsLarge(token) {
        return this.getData(1, 200, '', '', token);
    },

    getBookingsXLarge(token) {
        return this.getData(undefined, undefined, '', '', token);
    },

    getBookings(params, token) {
        const queryParams = params
            ? Object.keys(params)
                .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
                .join('&')
            : '';

        return fetch(`https://www.primefaces.org/data/bookings?${queryParams}`).then((res) => res.json());
    }
};
