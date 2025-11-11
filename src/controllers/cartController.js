import {
  getCartByUser,
  createCart,
  getCartItems,
  getCartItem,
  insertCartItem,
  updateQuantity,
  deleteCartItem,
  deleteCartByUser
} from "../models/cartModel.js";

/** ✅ Lấy giỏ hàng theo session */
export const getCart = async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in" });
    
    const user_id = req.session.user.id;
    const cart = await getCartByUser(user_id);

    if (!cart) return res.json({ cart_id: null, items: [] });

    const items = await getCartItems(cart.cart_id);
    res.json({ cart_id: cart.cart_id, items });
    
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/** ✅ Thêm SP vào giỏ theo session */
export const addToCart = async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in" });
    
    const user_id = req.session.user.id;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) return res.status(400).json({ message: "Missing product_id" });

    let cart = await getCartByUser(user_id);
    console.log('input',req.body);
    console.log('saved', cart);
    if (!cart) {
      const newId = await createCart(user_id);
      cart = { cart_id: newId };
    }

    const item = await getCartItem(cart.cart_id, product_id);

    if (item)
      await updateQuantity(item.cart_item_id, item.quantity + quantity);
    else
      await insertCartItem(cart.cart_id, product_id, quantity);

    res.json({ message: "Added to cart" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/** ✅ Update qty */
export const updateCartItem = async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in" });

    const { cart_item_id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0)
      return res.status(400).json({ message: "Qty invalid" });

    await updateQuantity(cart_item_id, quantity);
    res.json({ message: "Cart updated" });
    
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/** ✅ Remove item */
export const removeCartItem = async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in" });

    await deleteCartItem(req.params.cart_item_id);
    res.json({ message: "Item removed" });
    
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/** ✅ Xóa toàn bộ giỏ của user đang login */
export const clearCart = async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in" });

    const user_id = req.session.user.id;
    await deleteCartByUser(user_id);
    res.json({ message: "Cart cleared" });
    
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
