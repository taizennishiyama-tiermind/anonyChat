# CLAUDE.md - AI Assistant Guide for anonyChat

> Comprehensive guide for AI assistants working on the anonyChat codebase

## Project Overview

**anonyChat** (匿名リアルタイムチャット) is a real-time anonymous chat application designed for corporate training and events. It allows participants to join chat rooms anonymously or as named hosts, with features like reactions, mentions, and metrics dashboards.

**Key Characteristics:**
- **Language**: Japanese (UI and documentation)
- **Use Case**: Corporate training sessions, seminars, Q&A forums
- **Deployment**: AI Studio hosted static SPA
- **Backend**: Serverless (Supabase)
- **Total LOC**: ~1,316 lines

## Technology Stack

### Frontend
- **React**: 19.1.1 (latest, using React.FC pattern)
- **TypeScript**: 5.8.2 (strict type checking)
- **React Router DOM**: 7.9.1 (HashRouter for client-side routing)
- **Tailwind CSS**: 3.x (CDN, utility-first styling)
- **Vite**: 6.2.0 (build tool, dev server, HMR)

### Backend & Database
- **Supabase**: 2.57.4 (PostgreSQL + real-time subscriptions)
  - Client library: `@supabase/supabase-js`
  - Real-time channels for messages and reactions
  - No authentication (anonymous access via anon key)

### Build & Deploy
- **Platform**: AI Studio (https://ai.studio/)
- **CDN Dependencies**: Import maps for React/Router
- **Environment**: Node.js 20.x

## Directory Structure

```
/home/user/anonyChat/
├── App.tsx                    # Main routing component
├── index.tsx                  # React entry point with HashRouter
├── index.html                 # HTML template with Tailwind CDN
├── supabase.ts               # Supabase client with graceful degradation
├── types.ts                  # TypeScript type definitions
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── .env                      # Environment variables (Supabase)
├── components/
│   ├── Dashboard.tsx         # Metrics and analytics (376 lines)
│   ├── HomePage.tsx          # Room selection/creation (172 lines)
│   ├── MessageItem.tsx       # Individual message display (192 lines)
│   ├── RoomPage.tsx          # Main chat interface (376 lines)
│   └── icons.tsx             # SVG icon components (128 lines)
└── hooks/
    └── useChatRoom.ts        # Custom hook for chat logic (206 lines)
```

**Component Organization**: Flat structure (no nested directories)

## Database Schema

### Supabase Tables

#### `messages`
```typescript
{
  id: string              // Primary key (UUID)
  text: string           // Message content
  timestamp: string      // ISO 8601 datetime
  user_id: string        // Anonymous user ID (e.g., "user_abc123")
  room_id: string        // Room identifier (URL-encoded)
  is_host?: boolean      // true if sent by host
  host_name?: string     // Host display name (講演者, 司会, etc.)
  mentions?: string[]    // Array of mentioned user IDs
}
```

#### `reactions`
```typescript
{
  id: string              // Primary key
  type: 'like' | 'idea' | 'question' | 'confused'
  timestamp: string      // ISO 8601 datetime
  room_id: string        // Room identifier
}
```

#### `message_reactions`
```typescript
{
  id: string              // Primary key
  message_id: string     // FK to messages.id
  user_id: string        // User who reacted
  room_id: string        // Room identifier
  timestamp: string      // ISO 8601 datetime
  type: 'like' | 'idea' | 'question' | 'confused'
}
```

**Real-time Channels**:
- `messages-${roomId}` - New message events
- `reactions-${roomId}` - New global reaction events
- `message-reactions-${roomId}` - New message reaction events

## Key Conventions & Patterns

### Code Style

1. **Component Pattern**: Functional components with `React.FC`
   ```typescript
   const MyComponent: React.FC = () => { ... }
   ```

2. **State Management**: Local state + custom hooks (NO global state library)
   - Component UI state: `useState`
   - Shared logic: Custom hooks (e.g., `useChatRoom`)
   - Persistence: `localStorage` / `sessionStorage`

3. **Typing**: All components and functions are fully typed
   - Type definitions in `types.ts`
   - No `any` types (prefer `unknown` if needed)

4. **Naming Conventions**:
   - Components: PascalCase (`RoomPage`, `MessageItem`)
   - Hooks: camelCase with `use` prefix (`useChatRoom`)
   - Files: Match component name (`RoomPage.tsx`)
   - CSS classes: Tailwind utilities only (no custom classes)

### React Patterns Used

1. **Custom Hooks for Business Logic**
   - Example: `useChatRoom` encapsulates Supabase operations
   - Returns API object with functions and state

2. **Controlled Components**
   - All form inputs use `value` + `onChange`
   - Example: `<input value={roomName} onChange={...} />`

3. **Refs for DOM Access**
   - Auto-scroll: `messagesEndRef`
   - Focus management: `textareaRef`
   - Click-outside detection: `pickerRef`

4. **Memoization for Derived State**
   - `useMemo` for expensive calculations (participants, share links)
   - Dependency arrays carefully managed

5. **Effect Cleanup**
   - All `useEffect` hooks return cleanup functions
   - Supabase channel unsubscription in cleanup

### Supabase Patterns

1. **Graceful Degradation** (`supabase.ts:1-80`)
   - Falls back to mock client if env vars missing
   - Exports `isConfigured` flag for demo mode detection
   - No-op query builders for offline development

2. **Real-time Subscriptions**
   - Use `config: { broadcast: { self: false } }` to avoid echo
   - Subscribe in `useEffect`, unsubscribe in cleanup
   - Handle events with `setMessages(prev => [...prev, new])`

3. **Error Handling**
   - Always check `error` in Supabase responses
   - Log errors to console (no error boundaries yet)
   - Graceful failures (continue even if insert fails)

### State Persistence

1. **localStorage**:
   - `chat-user-id` - Persistent anonymous user ID (never clear)
   - `recentRooms` - JSON array of recent rooms (max 5)
   - `chat-host-name` - Last used host name

2. **sessionStorage**:
   - `allowHomeNavigation:${roomId}` - Navigation permission flags

3. **URL State**:
   - Room ID: Route parameter (`:roomId`)
   - Host mode: Query param (`?host=1`)
   - Host name: Query param (`?hostName=講演者`)

### Styling Conventions

1. **Tailwind Utility Classes**
   - Mobile-first: Base styles are mobile, `sm:` / `lg:` for larger
   - Dark mode: `dark:` prefix (media query based)
   - Spacing: Consistent scale (4, 8, 12, 16, etc.)

2. **Color Palette**:
   - Primary: `corp-blue` (#00529B), `corp-blue-light` (#007BFF)
   - Neutrals: `corp-gray-{100-900}`
   - Dark mode: Automatic via media query

3. **Responsive Breakpoints**:
   - `sm:` - 640px and up
   - `lg:` - 1024px and up
   - Max content width: `max-w-4xl`

4. **Custom Animations**:
   - Defined in `index.html` (not Tailwind config)
   - Example: `animate-fly-up` for reaction emojis

## Common Development Tasks

### 1. Adding a New Component

```typescript
// components/MyComponent.tsx
import React, { useState } from 'react';

const MyComponent: React.FC = () => {
  const [state, setState] = useState('');

  return (
    <div className="p-4 bg-white dark:bg-corp-gray-800">
      {/* Component content */}
    </div>
  );
};

export default MyComponent;
```

**Remember**:
- Place in `/components/` (flat structure)
- Use TypeScript with full typing
- Apply Tailwind classes for styling
- Add dark mode variants with `dark:` prefix

### 2. Adding a New Database Table

**Steps**:
1. Create table in Supabase dashboard
2. Add type definition to `types.ts`
3. Add query methods in relevant hook/component
4. Set up real-time subscription if needed
5. Update `supabase.ts` mock if using demo mode

**Example Type**:
```typescript
// types.ts
export interface MyTable {
  id: string;
  created_at: string;
  room_id: string;
  data: any;
}
```

### 3. Adding a Real-time Feature

**Pattern** (from `useChatRoom.ts:88-161`):
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`my-channel-${roomId}`, {
      config: {
        broadcast: { self: false },  // Don't echo own changes
        presence: { key: '' }
      }
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'my_table',
      filter: `room_id=eq.${roomId}`
    }, (payload) => {
      setMyData(prev => [...prev, payload.new as MyType]);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [roomId]);
```

### 4. Adding a New Route

**Steps**:
1. Create component in `/components/`
2. Add route to `App.tsx`
3. Add navigation links as needed

**Example**:
```typescript
// App.tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/room/:roomId" element={<RoomPage />} />
  <Route path="/settings" element={<SettingsPage />} />  // New
</Routes>
```

### 5. Adding a New Icon

**Pattern** (from `components/icons.tsx`):
```typescript
export const MyIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {/* SVG path data */}
  </svg>
);
```

**Usage**:
```typescript
import { MyIcon } from './icons';
<MyIcon className="w-5 h-5 text-corp-blue" />
```

### 6. Testing Locally

**Development Server**:
```bash
npm install
npm run dev
```

**Build Test**:
```bash
npm run build
npm run preview
```

**Environment Setup**:
- Copy `.env` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Or rely on demo mode (graceful degradation)

## Important Gotchas & Best Practices

### 1. Japanese Input (IME) Handling

**Problem**: Enter key triggers submit during Japanese composition

**Solution** (`RoomPage.tsx:254-271`):
```typescript
const [isComposing, setIsComposing] = useState(false);

<textarea
  onCompositionStart={() => setIsComposing(true)}
  onCompositionEnd={() => setIsComposing(false)}
  onKeyDown={(e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  }}
/>
```

**ALWAYS use this pattern for text inputs with Enter key handling.**

### 2. Room ID Encoding

**Problem**: Room names with special characters break URLs

**Solution**:
- ALWAYS use `encodeURIComponent()` when creating room URLs
- ALWAYS use `decodeURIComponent()` when reading from URL params

```typescript
// Creating link
navigate(`/room/${encodeURIComponent(roomName)}`);

// Reading param
const { roomId } = useParams();
const decodedRoomId = decodeURIComponent(roomId!);
```

### 3. Auto-scroll Behavior

**Implementation** (`RoomPage.tsx:239-247`):
```typescript
const messagesEndRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);

// In JSX
<div ref={messagesEndRef} />
```

**Scroll on**: New messages, not on reactions or typing

### 4. Demo Mode vs Production

**Check**: Use `isDemoMode` flag from `useChatRoom` hook

```typescript
const { isDemoMode } = useChatRoom(roomId);

{isDemoMode && (
  <div className="text-yellow-600">デモモード（データは保存されません）</div>
)}
```

**In Demo Mode**:
- Messages stored in local state only
- No persistence across refreshes
- Real-time sync doesn't work
- All Supabase operations are no-ops

### 5. Navigation Permission

**Pattern**: Use session storage + location state

```typescript
// When navigating TO room (HomePage.tsx:67)
navigate(`/room/${encodeURIComponent(room)}`, {
  state: { allowHomeNavigation: true }
});

// In RoomPage (RoomPage.tsx:219-225)
useEffect(() => {
  if (location.state?.allowHomeNavigation) {
    sessionStorage.setItem(`allowHomeNavigation:${roomId}`, 'true');
  }
}, []);

const canNavigateHome = sessionStorage.getItem(
  `allowHomeNavigation:${roomId}`
) === 'true';
```

**Why**: Prevents back button when accessing room via share link (security)

### 6. Mention Autocomplete

**Implementation** (`RoomPage.tsx:276-329`):

Key state:
- `mentionQuery` - Text after `@`
- `mentionStart` - Cursor position where `@` started
- `mentionCandidates` - Filtered participant list

**Always**:
- Track cursor position (`e.target.selectionStart`)
- Use `useMemo` for filtering candidates
- Update textarea value AND cursor position on selection

### 7. Reaction Animations

**Pattern** (`RoomPage.tsx:181-195`):
```typescript
const [flyingEmojis, setFlyingEmojis] = useState<
  { id: string; emoji: string }[]
>([]);

const handleReactionClick = (emoji: string) => {
  const id = Date.now().toString();
  setFlyingEmojis(prev => [...prev, { id, emoji }]);

  setTimeout(() => {
    setFlyingEmojis(prev => prev.filter(e => e.id !== id));
  }, 1000);

  addReaction(emoji);
};
```

**Cleanup after animation completes** (1s timeout)

### 8. Dark Mode

**Do NOT** use state-based dark mode toggling. The app uses **system preference only**:

```html
<!-- index.html -->
<script>
  tailwind.config = {
    darkMode: 'media',  // NOT 'class'
    // ...
  }
</script>
```

**Test dark mode**:
- macOS: System Preferences > General > Appearance
- Windows: Settings > Colors > Choose your mode
- Browser DevTools: Rendering > Emulate CSS media (prefers-color-scheme)

### 9. TypeScript Strict Mode

**tsconfig.json** has strict type checking enabled:
- No implicit `any`
- Null checks required (`!` or `?.` operator)
- Unused variables/imports flagged

**Common Patterns**:
```typescript
// Non-null assertion (use when you KNOW it exists)
const roomId = useParams().roomId!;

// Optional chaining (use when it might not exist)
messagesEndRef.current?.scrollIntoView();

// Type assertion (use sparingly)
const data = payload.new as Message;
```

### 10. Supabase Query Patterns

**Fetching**:
```typescript
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('room_id', roomId)
  .order('timestamp', { ascending: true });

if (error) {
  console.error('Error fetching messages:', error);
  return;
}
setMessages(data || []);
```

**Inserting**:
```typescript
const { error } = await supabase
  .from('messages')
  .insert([newMessage]);

if (error) {
  console.error('Error inserting:', error);
}
```

**ALWAYS check `error` before using `data`**

## File-Specific Notes

### `supabase.ts` (80 lines)

**Purpose**: Supabase client with graceful degradation

**Key Exports**:
- `supabase` - Client instance (real or mock)
- `isConfigured` - Boolean flag for demo mode detection

**Mock Implementation**:
- Returns no-op builders when env vars missing
- Allows development without Supabase setup
- All methods return `{ data: [], error: null }`

**NEVER modify** mock implementation to return fake data (keep it empty)

### `types.ts` (36 lines)

**Purpose**: Centralized type definitions

**Convention**: Export all types as `interface` (not `type` alias)

**When adding new types**:
- Match database schema exactly
- Use optional properties (`?`) for nullable columns
- Include JSDoc comments for complex types

### `hooks/useChatRoom.ts` (206 lines)

**Purpose**: Encapsulate all chat-related logic

**Returns**:
- State: `messages`, `reactions`, `messageReactions`
- Functions: `sendMessage`, `addReaction`, `addMessageReaction`
- Metadata: `currentUserId`, `isDemoMode`

**ALWAYS use this hook** for chat operations (don't access Supabase directly in components)

**Extension Pattern**:
```typescript
// Add new function to hook
const deleteMessage = async (messageId: string) => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) console.error(error);
  else setMessages(prev => prev.filter(m => m.id !== messageId));
};

return {
  // ... existing returns
  deleteMessage,  // Add to return object
};
```

### `components/RoomPage.tsx` (376 lines)

**Purpose**: Main chat interface (largest component)

**State Breakdown**:
- **Form state**: `newMessage`, `isComposing`
- **UI state**: `isCopied`, `isHostLinkCopied`, `showReactionPicker`
- **Animation state**: `flyingEmojis`
- **Mention state**: `mentionQuery`, `mentionStart`
- **Metadata**: `canNavigateHome`, `hostName`

**Responsibilities**:
- Message input and sending
- Reaction buttons and animations
- Share link generation and copying
- Mention autocomplete
- Dashboard integration
- Navigation guards

**Anti-pattern**: DO NOT split this component (it's meant to be comprehensive)

### `components/MessageItem.tsx` (192 lines)

**Purpose**: Individual message display with reactions

**Props**:
```typescript
{
  message: Message;
  isCurrentUser: boolean;
  currentUserId: string;
  onReactionClick: (messageId: string, emoji: string) => void;
  messageReactions: MessageReaction[];
  allMessages: Message[];
}
```

**Key Features**:
- Rich text rendering (URLs, mentions)
- Reaction picker popup
- Host badge display
- "あなた宛" (mentioned) indicator
- Sender/receiver styling differentiation

**URL Regex** (line 31):
```typescript
const urlRegex = /(https?:\/\/[^\s]+)/g;
```

**Mention Highlighting** (lines 93-103):
- Check if `currentUserId` is in `message.mentions[]`
- Show "💬 あなた宛" badge
- Highlight mentioned user names in text

### `components/Dashboard.tsx` (142 lines)

**Purpose**: Metrics and analytics display

**Metrics**:
- Total messages (goal: 500)
- Total reactions (goal: 1000)
- Reaction distribution (% breakdown)

**Props**:
```typescript
{
  messages: Message[];
  reactions: Reaction[];
  messageReactions: MessageReaction[];
  currentUserId: string;
}
```

**State**:
- `isExpanded` - Toggle detailed view

**Filtering**:
- Excludes demo/bot messages (line 21): `user_id !== 'demo'`

**Calculations**:
- Uses `useMemo` for derived metrics
- Progress bars: `(count / goal) * 100`

### `components/HomePage.tsx` (172 lines)

**Purpose**: Landing page for room selection/creation

**State**:
- `roomName` - Form input
- `recentRooms` - localStorage-backed array

**localStorage Key**: `recentRooms`
**Format**: `["部屋1", "部屋2", ...]`
**Max Length**: 5 rooms

**Room Creation** (lines 60-75):
1. Trim input
2. Add to recent rooms (max 5, dedupe)
3. Save to localStorage
4. Navigate with `state: { allowHomeNavigation: true }`

**Recent Rooms Display**:
- Show list with click handlers
- Format: Encoded room names in URLs

### `components/icons.tsx` (128 lines)

**Purpose**: Reusable SVG icon components

**Pattern**:
```typescript
export const IconName: React.FC<{ className?: string }> = ({
  className = ''
}) => (
  <svg className={className} /* ... */>
    {/* paths */}
  </svg>
);
```

**Icons**:
- SendIcon, ShareIcon, CheckIcon, BackIcon
- CommentIcon, SmileyIcon
- ThumbsUpIcon, LightBulbIcon, QuestionIcon, ConfusedIcon

**Usage**:
- All icons accept `className` prop
- Default size: `w-6 h-6`
- Default color: Inherits from `currentColor`

## Development Workflows

### Starting Development

```bash
# 1. Clone repository
git clone <repo-url>
cd anonyChat

# 2. Install dependencies
npm install

# 3. Set up environment (optional - demo mode works without this)
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start dev server
npm run dev
```

### Making Changes

**Workflow**:
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes with frequent commits
3. Test locally: `npm run dev`
4. Build test: `npm run build && npm run preview`
5. Commit: `git commit -m "feat: description"`
6. Push: `git push -u origin feature/my-feature`

**Commit Message Convention**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring
- `style:` - CSS/styling changes
- `docs:` - Documentation
- `chore:` - Build/config changes

### Testing Checklist

**Before Committing**:
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] No console errors in dev mode
- [ ] Test in both light and dark mode
- [ ] Test on mobile viewport (DevTools)
- [ ] Test Japanese input (IME composition)
- [ ] Test with Supabase (production mode)
- [ ] Test without Supabase (demo mode)

**Feature-Specific**:
- [ ] Real-time sync works across multiple tabs
- [ ] LocalStorage persists correctly
- [ ] Navigation guards work (back button behavior)
- [ ] Mention autocomplete works
- [ ] Reactions animate correctly
- [ ] Share links copy to clipboard

### Debugging Tips

**1. Real-time not working**:
- Check browser console for Supabase errors
- Verify channel subscription in Network tab (WebSocket)
- Check `broadcast: { self: false }` config
- Ensure `room_id` filter matches exactly

**2. Messages not persisting**:
- Check if in demo mode (`isDemoMode === true`)
- Verify `.env` variables are set correctly
- Check Supabase dashboard for inserted rows
- Look for `error` in console logs

**3. Styles not applying**:
- Verify Tailwind CDN loaded (check Network tab)
- Check for typos in class names
- Use browser DevTools to inspect computed styles
- Clear browser cache (Tailwind CDN caching)

**4. TypeScript errors**:
- Run `npx tsc --noEmit` to see all errors
- Check `types.ts` for missing definitions
- Verify imports are correct
- Use `// @ts-expect-error` as last resort (with comment explaining why)

**5. Navigation issues**:
- Check `sessionStorage` for navigation flags
- Verify `location.state` is passed correctly
- Test with both direct URL access and internal navigation
- Check HashRouter is wrapping App correctly

## Deployment

### Pre-deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables set in deployment platform
- [ ] Supabase RLS policies configured correctly
- [ ] Test production build locally: `npm run preview`
- [ ] No hardcoded secrets in code
- [ ] Update README if needed

### AI Studio Deployment

**Current Deployment**: https://ai.studio/apps/drive/1ripmyvGQmG6wU7xCE6Cxr6nubhCTQ3Ib

**Process**:
1. Push to main branch
2. AI Studio auto-deploys from main
3. Environment variables set in AI Studio dashboard
4. Build runs automatically (`npm run build`)
5. Static files served from `dist/`

**Environment Variables** (set in AI Studio):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `GEMINI_API_KEY` (currently unused in code)

### Alternative Deployment (Static Hosting)

**Compatible Platforms**:
- Vercel, Netlify, Cloudflare Pages, GitHub Pages

**Build Output**:
- Directory: `dist/`
- Type: Static SPA with HashRouter
- Server config: None required (client-side routing)

**Steps**:
1. `npm run build`
2. Upload `dist/` to static host
3. Set environment variables in platform
4. Deploy

## Security Considerations

### Current Security Model

**Anonymous Access**:
- No authentication required
- User IDs generated client-side (not secure)
- Anyone with room link can join

**Supabase Anon Key**:
- Public key (committed to repo)
- Only allows operations permitted by RLS policies
- NOT a security risk if RLS configured correctly

### Row-Level Security (RLS)

**IMPORTANT**: Ensure Supabase RLS policies are configured:

```sql
-- Example: Allow anyone to read messages in public rooms
CREATE POLICY "Allow read access to messages"
ON messages FOR SELECT
USING (true);

-- Example: Allow anyone to insert messages
CREATE POLICY "Allow insert messages"
ON messages FOR INSERT
WITH CHECK (true);
```

**Review RLS policies** in Supabase dashboard before making public

### Security Best Practices

**DO**:
- Keep anon key public (it's designed for this)
- Use RLS policies to control data access
- Validate input on client side (UX, not security)
- Sanitize user input for XSS (React does this automatically)

**DO NOT**:
- Commit service role key (has admin access)
- Store sensitive data in Supabase (this is public chat)
- Rely on client-side validation for security
- Use this for private/secure communications

### Known Limitations

1. **No Moderation**: Anyone can send anything
2. **No Delete**: Messages cannot be deleted by users
3. **No Rate Limiting**: Spam is possible
4. **No User Blocking**: No way to block abusive users
5. **Public Data**: All data is readable by anyone

**For Production**: Implement moderation, rate limiting, and content policies

## Future Enhancement Ideas

**Common Feature Requests**:

1. **Message Deletion**
   - Allow users to delete their own messages
   - Add soft delete with `deleted_at` column
   - Update MessageItem to show "[削除されました]"

2. **File Uploads**
   - Use Supabase Storage
   - Support images, PDFs
   - Show thumbnails in chat

3. **Typing Indicators**
   - Use Supabase Presence
   - Show "○○ is typing..." below messages

4. **Read Receipts**
   - Track last read timestamp per user
   - Show unread count on HomePage

5. **Emoji Reactions Palette**
   - Expand beyond 4 reactions
   - Allow custom emoji picker
   - More granular reaction types

6. **Export Chat**
   - Download chat as JSON/CSV/PDF
   - Filter by date range
   - Include reactions

7. **Moderation Tools**
   - Host-only message deletion
   - User muting/blocking
   - Content filtering

8. **Notifications**
   - Browser push notifications
   - Sound on new message
   - Mention-only notification mode

9. **Accessibility**
   - ARIA labels for screen readers
   - Keyboard navigation for reactions
   - High contrast mode

10. **Internationalization**
    - English translation
    - Language switcher
    - i18n framework (react-i18next)

## AI Assistant Workflow Recommendations

### When Analyzing Code

1. **Start with types**: Read `types.ts` to understand data structures
2. **Check routing**: Look at `App.tsx` to understand navigation
3. **Find the hook**: Most logic is in `useChatRoom.ts`
4. **Read component**: Understand UI in `RoomPage.tsx` or `HomePage.tsx`
5. **Check styles**: Reference Tailwind config in `index.html`

### When Implementing Features

1. **Create TODO list**: Use TodoWrite tool for complex tasks
2. **Update types first**: Add to `types.ts` if new data structures
3. **Modify database**: Update Supabase schema if needed
4. **Update hook**: Add logic to `useChatRoom.ts`
5. **Update component**: Modify relevant component in `/components`
6. **Test locally**: Run dev server and verify
7. **Check dark mode**: Test with system dark mode enabled
8. **Test IME**: Verify Japanese input works
9. **Build test**: Run `npm run build` before committing

### When Debugging

1. **Check console**: Browser console shows Supabase errors
2. **Verify demo mode**: Look for "デモモード" message
3. **Inspect state**: Use React DevTools
4. **Check storage**: Review localStorage/sessionStorage in DevTools
5. **Network tab**: Verify Supabase requests/WebSocket
6. **TypeScript**: Run `npx tsc --noEmit` for type errors

### When Refactoring

1. **Don't over-engineer**: Keep it simple
2. **Maintain patterns**: Follow existing conventions
3. **Preserve types**: Don't loosen type safety
4. **Test thoroughly**: Ensure nothing breaks
5. **Document changes**: Update this CLAUDE.md if needed

## Quick Reference

### Key Files by Task

| Task | Primary File | Related Files |
|------|-------------|---------------|
| Add database table | `types.ts` | `hooks/useChatRoom.ts`, Supabase dashboard |
| Add route | `App.tsx` | New component in `/components` |
| Add UI component | `/components/{Name}.tsx` | `types.ts` for props |
| Modify chat logic | `hooks/useChatRoom.ts` | `types.ts` |
| Add icon | `components/icons.tsx` | - |
| Modify styling | Component file | `index.html` (Tailwind config) |
| Configure build | `vite.config.ts` | `tsconfig.json` |
| Set environment | `.env` | `vite.config.ts`, `supabase.ts` |

### Important Constants

| Constant | Value | Location |
|----------|-------|----------|
| Max recent rooms | 5 | `HomePage.tsx:61` |
| Message goal | 500 | `Dashboard.tsx:28` |
| Reaction goal | 1000 | `Dashboard.tsx:37` |
| Emoji fly duration | 1000ms | `RoomPage.tsx:193` |
| Reaction types | 4 (like, idea, question, confused) | `types.ts:20-25` |

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | No (falls back to demo) |
| `VITE_SUPABASE_ANON_KEY` | Supabase public key | No (falls back to demo) |
| `GEMINI_API_KEY` | Gemini API (unused) | No |

### NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (Vite) |
| `npm run build` | Build for production (`dist/`) |
| `npm run preview` | Preview production build locally |

## Support & Resources

### Documentation
- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Supabase**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Vite**: https://vitejs.dev/guide/

### Supabase Dashboard
- **URL**: https://fwjldrngcvnvnkbxvhbm.supabase.co
- **Features**: Table editor, SQL editor, RLS policies, real-time logs

### AI Studio
- **App URL**: https://ai.studio/apps/drive/1ripmyvGQmG6wU7xCE6Cxr6nubhCTQ3Ib
- **Platform**: https://ai.studio/

---

**Last Updated**: 2025-12-02
**Version**: 1.0.0
**Maintained By**: AI Assistants working on anonyChat

---

## Appendix: Type Definitions Reference

```typescript
// Complete type definitions from types.ts

export interface Message {
  id: string;
  text: string;
  timestamp: string;
  user_id: string;
  room_id: string;
  is_host?: boolean;
  host_name?: string;
  mentions?: string[];
}

export interface Reaction {
  id: string;
  type: ReactionType;
  timestamp: string;
  room_id: string;
}

export type ReactionType = 'like' | 'idea' | 'question' | 'confused';

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  room_id: string;
  timestamp: string;
  type: ReactionType;
}
```

## Appendix: Component Props Reference

```typescript
// HomePage
// No props (uses URL params and hooks)

// RoomPage
// No props (uses URL params and hooks)

// MessageItem
interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  currentUserId: string;
  onReactionClick: (messageId: string, emoji: string) => void;
  messageReactions: MessageReaction[];
  allMessages: Message[];
}

// Dashboard
interface DashboardProps {
  messages: Message[];
  reactions: Reaction[];
  messageReactions: MessageReaction[];
  currentUserId: string;
}

// Icons
interface IconProps {
  className?: string;
}
```

## Appendix: Hook API Reference

```typescript
// useChatRoom hook
function useChatRoom(roomId: string): {
  messages: Message[];
  sendMessage: (text: string, mentions?: string[]) => Promise<void>;
  addReaction: (emoji: string) => Promise<void>;
  reactions: Reaction[];
  messageReactions: MessageReaction[];
  addMessageReaction: (messageId: string, emoji: string) => Promise<void>;
  currentUserId: string;
  isDemoMode: boolean;
}
```

---

**End of CLAUDE.md**
