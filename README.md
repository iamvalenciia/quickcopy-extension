# SwiftCopy - Smart Message Template Manager

![SwiftCopy Logo](/assets/image.png)

A powerful browser extension that streamlines your workflow by providing instant access to your frequently used messages and templates. Select text, press 's', and instantly search through your categorized message templates.

### Core Functionality

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

### Chrome Web Store

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/fenjcagcnjlhhpeccfopnhiieelcilbo?utm_source=item-share-cb)
2. Click "Add to Chrome"

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

### Project Structure

```
swiftcopy/
├── src/
│   ├── background/   # Background scripts
│   ├── mainView/     # Extension interface
│   └── popupView/    # Popup interface
├── assets/           # Icons and images
├── manifest.json     # Extension manifest
└── README.md         # Documentation
```

## Security

- No data collection
- Local storage only
- No external API calls
- Secure clipboard handling
- Isolated execution environment

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
