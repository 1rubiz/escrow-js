# ruby-escrow-js

A TypeScript SDK and hosted UI that wraps Payluk's escrow-as-a-service, providing a seamless integration for escrow transactions in your application.

## Overview

ruby-escrow-js provides two main components:

1. **SDK**: A lightweight TypeScript library that integrates into your application
2. **Hosted UI**: A secure, full-featured Next.js application that handles the complete escrow workflow

## Features

- 🔐 Secure escrow transaction management
- 💳 Multiple payment method support
- 📊 Real-time transaction status monitoring
- 🤝 Built-in dispute resolution
- 🎨 Customizable display modes (modal, fullscreen, inline)
- 📱 Responsive design
- 🔒 API key authentication
- 🌐 Works in browser and Node.js environments
- 💾 Participant history tracking
- 🔄 Pre-seeded transaction support

## Quick Start

### Installation

```bash
npm install ruby-escrow-js
```

### Basic Usage

#### Wallet-Only Mode

```typescript
import rubyEscrow from 'ruby-escrow-js';

// Configure the SDK
rubyEscrow.configure({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-hosted-ui.com'
});

// Open wallet for a customer
rubyEscrow.init({
  customerId: 'cust_1234567890',
  displayMode: 'modal', // default: 'modal' | 'fullscreen' | 'inline'
  onSuccess: (result) => {
    console.log('Session completed:', result);
  },
  onCancel: () => {
    console.log('Session cancelled');
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});
```

#### Pre-Seeded Transaction Mode

```typescript
// Create a transaction with pre-filled data
rubyEscrow.init({
  customerId: 'cust_1234567890',        // REQUIRED — your customer ID
  participantId: 'cust_0987654321',     // OPTIONAL — counterparty's customer ID
  isSeller: true,                        // Your role in the transaction
  amount: 5000,                          // REQUIRED when participantId is provided
  currency: 'NGN',                       // Optional, default: 'NGN'
  name: 'Laptop Purchase',               // Transaction name
  description: 'Dell XPS 15 laptop',     // Transaction description
  conditions: ['Item received', 'Quality verified'], // Optional conditions
  displayMode: 'modal',
  onSuccess: (result) => {
    // result contains: { buyerId, sellerId, transactionId, ... }
    console.log('Transaction created:', result);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});
```

#### Inline Mode (Embedded)

```typescript
// Embed the escrow widget directly into your page
rubyEscrow.init({
  customerId: 'cust_1234567890',
  displayMode: 'inline',
  container: '#escrow-widget', // CSS selector or HTMLElement
  onSuccess: (result) => {
    console.log('Transaction completed:', result);
  }
});
```

## Project Structure

```
ruby-escrow-js/
├── src/              # SDK source code
├── hosted-ui/        # Next.js hosted UI application
├── phases/           # Development phase documentation
├── examples/         # Integration examples
└── docs/             # Documentation
```

## Development

This project is organized into phases. See the `phases/` directory for detailed plans and progress tracking.

### Current Phase

Phase 7: SDK API Redesign, Customer History DB, Display Mode Options

## API Changes

### Breaking Changes (Phase 7)

The `rubyEscrow.init()` API has been redesigned for better ergonomics:

- **Removed**: `buyer` and `seller` objects
- **Added**: `participantId` (string), `isSeller` (boolean) for participant specification
- **Added**: `name` and `description` fields for transaction details
- **Added**: `displayMode` ('modal' | 'fullscreen' | 'inline') and `container` for display customization
- **Changed**: `onSuccess` callback now receives `{ buyerId, sellerId, ... }` instead of `{ buyer, seller, ... }`

### Migrating from Previous Versions

If you were using the old API with `buyer` and `seller` objects:

```typescript
// OLD - No longer works
rubyEscrow.init({
  customerId: 'cust_123',
  amount: 5000,
  buyer: { email: 'buyer@example.com' },
  seller: { email: 'seller@example.com' }
});

// NEW - Use Payluk customer IDs instead
rubyEscrow.init({
  customerId: 'cust_123',           // Your customer ID
  participantId: 'cust_456',        // Other party's customer ID
  isSeller: true,                   // Your role
  amount: 5000,
  currency: 'NGN',
  name: 'Transaction name',
  description: 'Transaction description'
});
```

## Key Features

### Display Modes

The escrow widget can be displayed in three different modes:

- **`modal`** (default): Centered fixed overlay with semi-transparent backdrop
- **`fullscreen`**: Full viewport overlay (100vw × 100vh)
- **`inline`**: Embedded directly into a specified container element on your page

### Pre-Seeded Transactions

When you provide `participantId`, `isSeller`, and transaction details (`amount`, `currency`, `name`, `description`), the hosted UI automatically opens the transaction creation form with:

- Participant name and email as **read-only** fields (locked)
- Transaction fields fully editable by the user
- Easy form submission

### Participant History

The hosted UI maintains a history of participants (customers) for each user. After creating a transaction with a participant, they appear in a dropdown menu for faster re-engagement in future sessions.

## Documentation

- [Getting Started](docs/getting-started.md) (Coming soon)
- [API Reference](docs/api-reference.md) (Coming soon)
- [Webhooks](docs/webhooks.md) (Coming soon)
- [Migration Guide](docs/migration-guide.md) (See "API Changes" section above)

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.