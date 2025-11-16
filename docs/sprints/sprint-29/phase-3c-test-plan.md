# Phase 3C Test Plan: Intent Detection Validation

**Status**: Ready for Manual Testing
**Date**: 2025-11-15

## Test Scenarios

### Test 1: Discussion Mode - Brainstorming
**Input**: "what do you think about this document?"
**Expected**:
- ✅ Mode indicator shows: 💬 Chat
- ✅ AI responds with text feedback
- ✅ Document remains unchanged
- ✅ No tool execution (no Replace/Insert indicators)

### Test 2: Discussion Mode - Questions
**Input**: "help me brainstorm ideas for the conclusion"
**Expected**:
- ✅ Mode indicator shows: 💬 Chat
- ✅ AI provides suggestions in text
- ✅ Document not modified
- ✅ Response appears as chat message

### Test 3: Edit Mode - Replace
**Input**: "replace hello with goodbye"
**Expected**:
- ✅ Mode indicator shows: ✏️ Edit
- ✅ AI executes replaceText tool
- ✅ Document updated (hello → goodbye)
- ✅ Tool indicator shows: Replace

### Test 4: Edit Mode - Insert
**Input**: "add examples after the introduction"
**Expected**:
- ✅ Mode indicator shows: ✏️ Edit
- ✅ AI executes insertText tool
- ✅ New content inserted
- ✅ Tool indicator shows: Insert

### Test 5: Ambiguous Input - Default to Discussion
**Input**: "tell me more"
**Expected**:
- ✅ Mode indicator shows: 💬 Chat (default)
- ✅ AI responds with text
- ✅ Document unchanged
- ✅ Safe fallback behavior

### Test 6: Mixed Keywords - Discussion Priority
**Input**: "what do you think? should i replace this?"
**Expected**:
- ✅ Mode indicator shows: 💬 Chat (discussion has priority)
- ✅ AI responds with advice
- ✅ No automatic replacement
- ✅ User control preserved

## Manual Test Steps

1. **Start Development Server**:
   ```bash
   cd ritemark-app
   npm run dev
   ```

2. **Open Browser**: Navigate to `http://localhost:5173`

3. **Create Test Document**:
   - Sign in with Google Drive
   - Create new document
   - Add sample text: "hello world. This is a test document."

4. **Configure AI Assistant**:
   - Open Settings → General
   - Add OpenAI API key
   - Save settings

5. **Open AI Sidebar**: Press `Ctrl+Shift+A` (or click AI icon)

6. **Run Test Scenarios**: Execute each test above

7. **Verify Visual Indicators**:
   - Check user message shows mode icon (💬 or ✏️)
   - Check AI response shows appropriate indicator
   - Verify tool icons appear when tools are used

8. **Check Console Logs**:
   - Open DevTools (F12)
   - Look for: `[OpenAI] Detected intent: discussion` or `[OpenAI] Detected intent: edit`
   - Verify intent detection accuracy

## Validation Checklist

- [ ] Discussion keywords trigger chat mode
- [ ] Edit keywords trigger edit mode
- [ ] Ambiguous messages default to discussion
- [ ] Mode indicators appear correctly
- [ ] Document only modified in edit mode
- [ ] Tool icons show for replace/insert
- [ ] Chat icon shows for discussion mode
- [ ] Intent detection logged in console
- [ ] Conversation history preserved across modes
- [ ] No TypeScript errors in console

## Expected Console Output

**Discussion Mode**:
```
[OpenAI] Detected intent: discussion
[OpenAI] Sending request with 3 messages (2 history)
[OpenAI] Response received in 1234ms
```

**Edit Mode**:
```
[OpenAI] Detected intent: edit
[OpenAI] Sending request with 3 messages (2 history)
[OpenAI] Response received in 2345ms
```

## Regression Tests

- [ ] Existing edit commands still work
- [ ] Selection context preserved
- [ ] Multi-turn conversation works
- [ ] Error handling unchanged
- [ ] Token refresh still functional
- [ ] File operations unaffected

## Browser Testing

### Chrome/Edge
- [ ] Mode indicators render correctly
- [ ] Icons display properly
- [ ] No console errors
- [ ] Performance acceptable

### Firefox
- [ ] Mode indicators render correctly
- [ ] Icons display properly
- [ ] No console errors
- [ ] Performance acceptable

### Safari
- [ ] Mode indicators render correctly
- [ ] Icons display properly
- [ ] No console errors
- [ ] Performance acceptable

## Performance Validation

- [ ] Intent detection adds minimal latency (<1ms)
- [ ] No memory leaks from mode tracking
- [ ] Icon rendering doesn't slow UI
- [ ] Mode detection scales with message history

## Accessibility Testing

- [ ] Mode icons have proper aria-labels
- [ ] Screen reader announces mode changes
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient

## Known Limitations

1. **Keyword-Based Detection**: May misclassify complex queries
2. **No Manual Override**: Users can't force mode selection (future feature)
3. **English Keywords Only**: Non-English commands may default to discussion
4. **Static Keyword List**: Can't learn from user behavior (future enhancement)

## Future Test Scenarios

1. **Machine Learning Intent**: Train model on user corrections
2. **Contextual Intent**: Use conversation history for detection
3. **Confidence Scoring**: Show uncertainty when ambiguous
4. **User Feedback**: "Was this the right mode?" confirmations
5. **Multi-Language**: Support non-English intent keywords
