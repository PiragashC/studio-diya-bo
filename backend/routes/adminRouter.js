const router = require("express").Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  createOrderType,
  getOrderTypes,
  updateOrderTypes,
  getTotalAmount,
  createOrder,
  editOrder,
  changeOrderStatusToBalanceSettled,
  deleteOrderTypes
} = require("../controller/adminController");


//endpoint to create an order type
router.post("/create-order-type", authMiddleware, createOrderType);

//endpoint to get all order types
router.get('/get-order-type', authMiddleware, getOrderTypes);

//endpoint to update order types
router.put('/update-order-type/:id', authMiddleware, updateOrderTypes);

//endpoint to get total amount
router.get('/get-total-amount', authMiddleware, getTotalAmount);

//endpoint to create an order
router.post('/create-order', authMiddleware, createOrder);

//endpoint to update order
router.put('/update-order/:id', authMiddleware, editOrder);

//endpoint to change order status to balance settled viseversa
router.patch('/change-order-status/:id', authMiddleware, changeOrderStatusToBalanceSettled);

//endpoint to delete order type
router.delete('/delete-order-type/:id', authMiddleware, deleteOrderTypes);

module.exports = router;
