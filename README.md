# TEFI Backend

A TypeScript-based backend service for executing and managing cryptocurrency trades via Uniswap, with secure trade data storage.

## Features

- 🔄 Uniswap Integration for trading
  - Market orders (buy/sell)
  - Limit orders
  - Stop loss orders
  - Price queries
- 🔐 Nillion Integration for Secure Trade Storage
  - Store trade data
  - Retrieve trade history
  - Update trade information
- 📊 Order Management
  - Active order tracking
  - Order cancellation
  - Order status monitoring

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Ethereum wallet with private key
- RPC Provider URL

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/tefi-be.git
cd tefi-be
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Server Configuration
PORT=3000              # Server port number
NODE_ENV=development   # Environment (development/production)

# Ethereum Configuration
RPC_URL=              # Ethereum RPC URL 
PRIVATE_KEY=          # Wallet private key (64 characters, no 0x prefix)
BACKUP_RPC_URL=       # Backup Ethereum RPC URL (optional)

# Nillion Storage Configuration
NILLION_APP_ID=       # Nillion application ID
NILLION_USER_SEED=    # Nillion user seed for encryption
NILLION_API_BASE=     # Nillion API base URL
```

## Development

Start the development server:
```bash
npm run dev
# or
yarn dev
```

## API Endpoints

### Trade Routes

- `POST /trade/market-buy` - Execute market buy order
- `POST /trade/market-sell` - Execute market sell order
- `POST /trade/limit-buy` - Place limit buy order
- `POST /trade/limit-sell` - Place limit sell order
- `POST /trade/stop-loss` - Set stop loss order
- `GET /trade/price/:tokenAddress` - Get token price
- `DELETE /trade/order/:orderId` - Cancel order
- `GET /trade/orders` - Get active orders

### Store Routes

- `POST /store` - Store new trade
- `GET /store/:storeId/:secretName` - Retrieve trade
- `PUT /store/:storeId/:secretName` - Update trade

## Security

- Never commit your `.env` file
- Use a dedicated wallet for trading
- Regularly rotate API keys
- Monitor transaction limits

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "error": "Error message description"
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)
