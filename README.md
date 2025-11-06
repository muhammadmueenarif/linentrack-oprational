# LinenTrack Operations Application

This is the Operations module of the LinenTrack system, separated into its own Next.js application for independent hosting and deployment.

## Features

- **Operations Dashboard**: Central hub for all operations management
- **Cleaning Operations**: Manage cleaning workflow, assign machines and racks, track progress
- **Ready for Collection**: Handle items ready for customer pickup/delivery
- **Ironing Operations**: Manage ironing workflow and completion
- **RFID Scanning**: Scan RFID tags for quick order lookup
- **Alert System**: Report equipment issues and maintenance needs

## Authentication

This app is restricted to staff users with `accessMode: 'operations'` or `accessMode: 'operation'`. Users are automatically redirected based on their permissions.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (create `.env.local`):
```bash
# Add your Firebase configuration and other environment variables
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
├── Admin/
│   ├── Operational/        # Operations dashboard and cleaning
│   ├── Cleaning/          # Cleaning operations
│   ├── Ready/             # Ready for collection
│   ├── Ironing/           # Ironing operations
│   └── common/            # Shared admin components
├── Common/                # Shared components
├── Login/                 # Login page
└── ui/                    # UI component library
```

## Key Operations Modules

### Cleaning Operations (`/Admin/Operational`)
- Packing report view
- Order status management
- Machine and rack assignment
- RFID scanning integration
- Alert system for issues

### Ready for Collection (`/Admin/Ready`)
- Items ready for customer pickup
- Delivery coordination
- Payment processing
- Due balance tracking

### Ironing Operations (`/Admin/Ironing`)
- Ironing workflow management
- Quality control
- Completion tracking

## Deployment

This application can be deployed independently to any hosting platform that supports Next.js applications (Vercel, Netlify, AWS, etc.).

## Related Applications

- **Admin App**: Main administration interface
- **POS App**: Point of Sale system

Each application is designed to run independently with its own authentication and feature set.
# linentrack-operational
# linentrack-oprational
# linentrack-oprational
