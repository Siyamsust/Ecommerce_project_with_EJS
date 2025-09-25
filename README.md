# E-commerce Project with EJS

A full-featured e-commerce web application built using Node.js, Express.js, and EJS templating engine.

## Features

- User Authentication (Register/Login/Logout)
- Product Catalog with Categories
- Shopping Cart Functionality
- User Profile Management
- Order Processing and History
- Admin Dashboard for Product Management
- Responsive Design

## Technologies Used

- **Backend:**
  - Node.js
  - Express.js
  - MongoDB
  - Mongoose

- **Frontend:**
  - EJS (Embedded JavaScript templating)
  - Bootstrap
  - CSS3
  - JavaScript

- **Authentication:**
  - Passport.js
  - JWT (JSON Web Tokens)

## Prerequisites

Before running this project, make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB
- npm (Node Package Manager)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Siyamsust/Ecommerce_project_with_EJS.git
   cd Ecommerce_project_with_EJS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a .env file in the root directory and add your environment variables:
   ```
   PORT=3000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the application:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## Project Structure

```
Ecommerce_project_with_EJS/
├── config/
├── controllers/
├── middleware/
├── models/
├── public/
│   ├── css/
│   ├── js/
│   └── images/
├── routes/
├── views/
├── .env
├── .gitignore
├── app.js
└── package.json
```

## Main Features Description

### User Features
- Browse products by categories
- Search functionality
- Add/remove items to cart
- Manage user profile
- View order history
- Checkout process

### Admin Features
- Product management (CRUD operations)
- Order management
- User management
- Category management
- Dashboard with statistics

## API Endpoints

- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create new product (Admin)
- `PUT /api/products/:id` - Update product (Admin)
- `DELETE /api/products/:id` - Delete product (Admin)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

## Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Author

- **Siyam** - [GitHub Profile](https://github.com/Siyamsust)

## Acknowledgments

- Thanks to all contributors who helped with the project
- Inspiration from various e-commerce platforms
- Express.js and EJS documentation

## Support

For support, email your queries to siyamsust@gmail.com or open an issue in the repository.