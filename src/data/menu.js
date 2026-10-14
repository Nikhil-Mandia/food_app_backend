const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=70`;

module.exports = [
  { name: 'Margherita Pizza', description: 'Wood-fired base, San Marzano tomato, fresh mozzarella and basil.', price: 349, category: 'Pizza', image: img('photo-1513104890138-7c749659a591') },
  { name: 'Classic Cheeseburger', description: 'Grilled patty, cheddar, pickles and house sauce in a toasted bun.', price: 249, category: 'Burgers', image: img('photo-1568901346375-23c9450c58cd') },
  { name: 'Creamy Alfredo Pasta', description: 'Penne tossed in parmesan cream sauce with garlic and herbs.', price: 299, category: 'Pasta', image: img('photo-1621996346565-e3dbc646d9a9') },
  { name: 'Crispy Fries', description: 'Skin-on fries with sea salt and peri-peri seasoning.', price: 129, category: 'Sides', image: img('photo-1573080496219-bb080dd4f877') },
  { name: 'Garden Fresh Salad', description: 'Greens, cherry tomato, cucumber, olives and lemon vinaigrette.', price: 189, category: 'Healthy', image: img('photo-1512621776951-a57141f2eefd') },
  { name: 'Salmon Sushi Platter', description: 'Eight pieces of salmon nigiri with wasabi and pickled ginger.', price: 499, category: 'Sushi', image: img('photo-1579871494447-9811cf80d66c') },
  { name: 'Street Tacos', description: 'Three soft tacos with spiced chicken, slaw and lime crema.', price: 229, category: 'Mexican', image: img('photo-1565299585323-38d6b0865b47') },
  { name: 'Fudge Brownie', description: 'Warm chocolate brownie with a gooey centre.', price: 119, category: 'Dessert', image: img('photo-1606313564200-e75d5e30476c') },
];
