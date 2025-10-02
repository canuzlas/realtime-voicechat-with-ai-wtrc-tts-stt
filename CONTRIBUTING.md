# Contributing to AI Voice Chat Assistant 🤝

First off, thank you for considering contributing to AI Voice Chat Assistant! It's people like you that make this project great.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)

## 📜 Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to canuzlass@gmail.com.

## 🎯 How Can I Contribute?

### Reporting Bugs 🐛

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Mention your environment** (OS, Node version, browser)

### Suggesting Enhancements 💡

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **Include mockups or examples if applicable**

### Pull Requests 🔄

- Fill in the required template
- Follow the coding guidelines
- Include appropriate test coverage
- Update documentation as needed
- End all files with a newline

## 🛠️ Development Setup

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/realtime-voicechat-with-ai-wtrc-tts-stt.git
   ```
3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/canuzlas/realtime-voicechat-with-ai-wtrc-tts-stt.git
   ```
4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
5. **Make your changes**
6. **Test your changes**
   ```bash
   npm test
   ```
7. **Commit your changes**
8. **Push to your fork**
9. **Create a Pull Request**

## 🔀 Pull Request Process

1. **Update the README.md** with details of changes if applicable
2. **Update the CHANGELOG.md** with a note describing your changes
3. **Ensure all tests pass** and code follows our guidelines
4. **Request review** from maintainers
5. **Address feedback** and make necessary changes
6. **Squash commits** if requested
7. **Wait for approval** and merge

### PR Checklist

- [ ] My code follows the project's coding guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## 📝 Coding Guidelines

### JavaScript/React

- Use ES6+ features
- Follow Airbnb JavaScript Style Guide
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable and function names
- Add comments for complex logic
- Avoid inline styles; use Tailwind CSS classes

### Example:
```jsx
// Good
const ChatMessage = ({ message, sender, timestamp }) => {
  const isUser = sender === 'user'
  
  return (
    <div className={`message ${isUser ? 'user-message' : 'ai-message'}`}>
      <p>{message}</p>
      <span className="timestamp">{timestamp}</span>
    </div>
  )
}

// Bad
const Message = (props) => {
  return <div style={{color: 'white'}}>{props.msg}</div>
}
```

### Backend

- Follow MVC pattern
- Use async/await over callbacks
- Implement proper error handling
- Add JSDoc comments for functions
- Keep routes thin, logic in controllers/services
- Use environment variables for configuration

### Example:
```javascript
/**
 * Send a chat message to the AI
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<Object>} AI response
 */
async function sendMessage(req, res) {
  try {
    const { message } = req.body
    const response = await gptService.chat(message)
    return res.json({ success: true, reply: response })
  } catch (error) {
    return handleError(error, res)
  }
}
```

## 💬 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples:
```bash
feat(chat): add voice message support
fix(auth): resolve JWT token expiration issue
docs(readme): update installation instructions
style(components): format code with prettier
refactor(api): simplify error handling
test(chat): add unit tests for message sending
chore(deps): update dependencies
```

## 🎨 UI/UX Guidelines

- Maintain the cyber-futuristic theme
- Use glassmorphism effects consistently
- Follow the color palette (neon blue, purple, pink)
- Ensure responsive design (mobile-first)
- Add smooth animations (Framer Motion)
- Maintain accessibility standards
- Test on multiple browsers

## 🧪 Testing Guidelines

- Write tests for new features
- Maintain or increase code coverage
- Test edge cases
- Use meaningful test descriptions
- Mock external dependencies
- Run tests before submitting PR

## 📚 Documentation Guidelines

- Update README.md for new features
- Add JSDoc comments for functions
- Include code examples
- Keep documentation up-to-date
- Use clear and concise language
- Add screenshots for UI changes

## ❓ Questions?

Don't hesitate to ask questions! You can:
- Open a GitHub Discussion
- Create an issue with the `question` label
- Contact the maintainers

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

---

**Happy Coding!** 🚀
