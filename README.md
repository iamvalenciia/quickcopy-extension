# SwiftCopy - Smart Message Template Manager

![SwiftCopy Logo](/assets/icon.png)

A powerful browser extension that streamlines your workflow by providing instant access to your frequently used messages and templates. Select text, press 's', and instantly search through your categorized message templates.

## 🌟 Features

### Core Functionality
- **Quick Access**: Select text and press 's' to instantly open the message search interface
- **Smart Search**: Real-time filtering with highlighted matches as you type
- **Category Management**: Organize messages into custom categories
- **One-Click Copy**: Copy messages to clipboard with a single click
- **Cross-Website Support**: Works on all websites (except Google Search)
- **JSON Import/Export**: Share and backup templates using JSON format
- **Secure Storage**: Local browser storage for your messages
- **Keyboard Navigation**: Full keyboard support for power users

### Technical Features
- Modern web technologies for optimal performance
- Isolated content script execution
- Efficient DOM manipulation
- Responsive design
- Smart caching system
- Cross-browser clipboard API support

## 🚀 Installation

### Chrome Web Store
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore)
2. Search for "SwiftCopy"
3. Click "Add to Chrome"

### Manual Installation
1. Download the latest release
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the extension directory

## 💻 Usage

### Basic Usage
1. Select any text on a webpage
2. Press 's' to open the search interface
3. Type to search through your messages
4. Click a message to copy it to clipboard

### Managing Templates
1. Click the extension icon to open options
2. Add new categories and messages
3. Organize your templates
4. Export/Import using JSON format

### Keyboard Shortcuts
- `s`: Open search interface
- `Esc`: Close popup
- `Enter`: Copy selected message
- `↑/↓`: Navigate messages

## 🔧 Configuration

### Message Categories
- Create custom categories
- Add messages to categories
- Reorder categories
- Delete unused categories

### Import/Export
- Export all templates as JSON
- Import templates from JSON
- Share templates with team members
- Backup your templates

## 🛠️ Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Chrome browser

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/swiftcopy.git

# Install dependencies
npm install

# Build the extension
npm run build

# Load the extension in Chrome
# Go to chrome://extensions/
# Enable Developer mode
# Click "Load unpacked"
# Select the 'dist' directory
```

### Project Structure
```
swiftcopy/
├── src/
│   ├── background/     # Background scripts
│   ├── content/        # Content scripts
│   ├── options/        # Options page
│   └── popup/          # Popup interface
├── assets/            # Icons and images
├── manifest.json      # Extension manifest
└── README.md         # Documentation
```

### Building
```bash
# Development build
npm run dev

# Production build
npm run build
```

## 🔒 Security

- No data collection
- Local storage only
- No external API calls
- Secure clipboard handling
- Isolated execution environment

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors
- Inspired by the need for efficient message management
- Built with modern web technologies

## 📧 Support

For support, please:
- Open an issue on GitHub
- Contact us at support@swiftcopy.com
- Visit our [documentation](https://docs.swiftcopy.com)

## 🔄 Updates

### Version 1.0.5
- Added JSON import/export functionality
- Improved search performance
- Enhanced UI/UX
- Bug fixes and stability improvements

### Version 1.0.0
- Initial release
- Core functionality implementation
- Basic template management
- Search and copy features

---

Made with ❤️ by the SwiftCopy Team 