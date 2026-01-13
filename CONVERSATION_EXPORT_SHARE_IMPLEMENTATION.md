# Conversation Export and Sharing Implementation

## Overview

This document describes the implementation of conversation export and sharing features as specified in CLAUDE.md (lines 239-240).

## Features Implemented

### 1. Export Features

#### Markdown Export
- Converts conversation to formatted Markdown (.md) file
- Includes conversation title, model info, timestamps
- Formats messages with role indicators (User/Assistant)
- Preserves conversation structure

#### PDF Export
- Generates professional PDF document
- Includes metadata (model, creation date, update date)
- Properly formatted messages with page breaks
- Automatic word wrapping and pagination

### 2. Sharing Features

#### Shareable Links
- Generate unique, secure share tokens
- Three privacy levels:
  - **Private**: Only the owner can access
  - **Link**: Anyone with the link can view
  - **Public**: Listed in public gallery (future feature)
- Optional expiration dates (1, 7, 30, 90 days, or never)
- View count tracking
- Copy-to-clipboard functionality

#### Public View Page
- Clean, read-only conversation display
- No authentication required
- Shows metadata (model, date, view count)
- Expiration warnings
- Call-to-action for new users

## Files Created/Modified

### New Files

1. **Database Migration**
   - `/supabase/migrations/20260109000000_conversation_sharing.sql`
   - Creates `shared_conversations` table
   - Adds RLS policies for security
   - Functions for token generation and view counting

2. **Modal Components**
   - `/src/components/modals/ExportConversationModal.tsx`
   - `/src/components/modals/ShareConversationModal.tsx`

3. **Public View Page**
   - `/src/pages/SharedConversation.tsx`

### Modified Files

1. **Service Layer**
   - `/src/services/conversationService.ts`
   - Added methods:
     - `exportAsMarkdown()`
     - `exportAsPDF()`
     - `shareConversation()`
     - `updateSharePrivacy()`
     - `getSharedConversation()`
     - `unshareConversation()`
     - `getUserSharedConversations()`

2. **Chat Page**
   - `/src/pages/Chat.tsx`
   - Added export and share buttons in header
   - Integrated modal components
   - Shows buttons only when conversation has messages

3. **App Router**
   - `/src/App.tsx`
   - Added public route `/share/:token`
   - Accessible without authentication

## Database Schema

### shared_conversations Table

```sql
CREATE TABLE public.shared_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  share_token TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  messages JSONB NOT NULL,
  model TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  privacy TEXT NOT NULL DEFAULT 'private',
  view_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Security Features

- Row Level Security (RLS) enabled
- Users can only manage their own shares
- Public/link shares accessible based on privacy setting
- Unique token generation with collision checking
- Expiration date validation

## UI Components

### Export Modal

Features:
- Two export format options (Markdown, PDF)
- Visual format indicators
- Loading states
- Success/error feedback

### Share Modal

Features:
- Privacy level selector (Private/Link/Public)
- Optional expiration date
- Share URL display with copy button
- Update existing shares
- Unshare functionality
- Visual feedback for all actions

### Shared Conversation Page

Features:
- Clean, minimal design
- Conversation metadata display
- Message rendering with MarkdownRenderer
- View count tracking
- Expiration warnings
- Call-to-action for unauthenticated users

## User Flow

### Export Flow
1. User clicks Export button in chat header
2. Export modal opens with format options
3. User selects Markdown or PDF
4. File downloads automatically
5. Success notification appears

### Share Flow
1. User clicks Share button in chat header
2. Share modal opens
3. User configures privacy and expiration
4. User clicks "Generate Link"
5. Share URL appears with copy button
6. User can copy and share the link

### View Shared Conversation
1. User receives share link
2. User opens link in browser
3. Public view page loads (no auth required)
4. Conversation displays with metadata
5. View count increments
6. User can navigate to sign up/login

## Technical Details

### Dependencies Added
- `jspdf` - PDF generation
- `html2canvas` - Not actively used but installed for future HTML-to-PDF

### Export Implementation
- Markdown export uses string template building
- PDF export uses jsPDF with word wrapping and pagination
- Downloads triggered via blob URLs

### Sharing Implementation
- Share tokens generated server-side via PostgreSQL function
- RLS policies ensure data security
- View counting uses database function (no authentication required)
- Token uniqueness guaranteed by retry loop

## Security Considerations

1. **RLS Policies**: All database operations protected by Row Level Security
2. **Token Security**: 12-character alphanumeric tokens with collision checking
3. **Expiration**: Links can expire automatically
4. **Privacy Control**: Three-tier privacy system
5. **No PII Leakage**: Public view doesn't expose user email or sensitive data

## Future Enhancements

1. **Public Gallery**: Display all "public" shared conversations
2. **Share Analytics**: Track link clicks, visitor locations
3. **Social Sharing**: One-click share to Twitter, LinkedIn
4. **Embed Code**: Generate iframe embeds for blogs
5. **Version Control**: Track conversation updates after sharing
6. **Collaboration**: Allow shared viewers to comment
7. **Export Options**: JSON, HTML, DOCX formats

## Testing Checklist

### Export Testing
- [ ] Export Markdown with multiple messages
- [ ] Export PDF with long conversations (pagination)
- [ ] Export with special characters/emojis
- [ ] Export with code blocks and markdown formatting
- [ ] Verify file download in different browsers

### Sharing Testing
- [ ] Generate share link with "link" privacy
- [ ] Generate share link with expiration
- [ ] Access shared link without authentication
- [ ] Verify view count increments
- [ ] Update privacy settings on existing share
- [ ] Unshare conversation
- [ ] Access expired share link (should fail)
- [ ] Copy link to clipboard
- [ ] Share link via email/messaging

### Database Testing
- [ ] Run migration successfully
- [ ] Verify RLS policies work
- [ ] Test token generation function
- [ ] Test view count increment function
- [ ] Verify cascade delete on conversation deletion

## Migration Steps

### 1. Database Migration
```bash
# Apply the migration
supabase db push

# Or manually run:
psql $DATABASE_URL -f supabase/migrations/20260109000000_conversation_sharing.sql
```

### 2. Install Dependencies
```bash
npm install jspdf html2canvas --legacy-peer-deps
```

### 3. TypeScript Check
```bash
npx tsc --noEmit
```

### 4. Test in Development
```bash
npm run dev
```

### 5. Deploy to Production
- Ensure Supabase migration is applied
- Deploy frontend with new code
- Test all features in production

## Known Issues / Limitations

1. **PDF Formatting**: Basic text-only PDF generation. No images or complex formatting.
2. **Large Conversations**: Very long conversations may have performance issues in PDF export.
3. **Mobile PDF**: PDF downloads may behave differently on mobile browsers.
4. **Token Collisions**: Theoretical possibility of token collision (mitigated by retry loop).

## API Reference

### conversationService Methods

#### exportAsMarkdown
```typescript
async exportAsMarkdown(conversationId: string, userEmail: string): Promise<string>
```

#### exportAsPDF
```typescript
async exportAsPDF(conversationId: string, userEmail: string): Promise<Blob>
```

#### shareConversation
```typescript
async shareConversation(
  conversationId: string,
  userEmail: string,
  privacy: 'private' | 'link' | 'public' = 'link',
  expiresInDays?: number
): Promise<{ shareToken: string; shareUrl: string }>
```

#### getSharedConversation
```typescript
async getSharedConversation(shareToken: string): Promise<SharedConversationData>
```

#### updateSharePrivacy
```typescript
async updateSharePrivacy(
  shareToken: string,
  privacy: 'private' | 'link' | 'public'
): Promise<void>
```

#### unshareConversation
```typescript
async unshareConversation(shareToken: string): Promise<void>
```

## Component Props

### ExportConversationModal
```typescript
interface ExportConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationTitle: string;
  userEmail: string;
}
```

### ShareConversationModal
```typescript
interface ShareConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  conversationTitle: string;
  userEmail: string;
}
```

## Conclusion

The conversation export and sharing features are now fully implemented and ready for testing. All files follow the project's coding standards and design system. The implementation includes proper security measures, user feedback, and error handling.

Next steps:
1. Run manual testing on all features
2. Write unit tests for service methods
3. Write E2E tests for user flows
4. Document any issues found during testing
5. Deploy to staging for QA review
