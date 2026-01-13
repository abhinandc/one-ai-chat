# Admin Guide: Prompt Feed Management

## Quick Start

### What are Prompt Feeds?

Prompt Feeds allow OneEdge administrators to connect external prompt community sources (like GitHub repositories, API endpoints, or RSS feeds) so employees can discover and use high-quality prompts from the broader AI community.

---

## Step 1: Access Admin Settings

1. Navigate to **Admin Settings** from the sidebar
2. Click the **Prompt Feeds** tab
3. You'll see a list of all configured feeds

---

## Step 2: Add a New Prompt Feed

### Basic Configuration

1. Click **Add Feed** button
2. Fill in the required fields:

   - **Feed Name:** A friendly name (e.g., "Awesome Prompts", "OpenAI Cookbook")
   - **Source Type:** Choose from:
     - **API:** Standard REST JSON endpoint
     - **Webhook:** Push-based updates (future)
     - **RSS:** RSS/XML feed
   - **Source URL:** The full URL to fetch prompts from
   - **Refresh Interval:** How often to sync (in minutes, minimum 5)
   - **Active:** Toggle to enable/disable the feed

### Test Before Creating (Recommended)

1. Fill in the Name and Source URL
2. Click **Test Connection** at the bottom left
3. Wait for the result:
   - ✓ **Success:** Shows sample prompts fetched
   - ✗ **Error:** Shows specific error message
4. If successful, click **Create Feed**

---

## Step 3: Sync Prompts

### Manual Sync

After creating a feed, you need to sync it to fetch prompts:

1. Find your feed in the list
2. Click the **Refresh icon** (↻) button
3. Watch the sync status:
   - **Pending:** Fetching in progress...
   - **Success:** Shows prompt count (e.g., "15 prompts stored")
   - **Error:** Shows error message

### Sync Results

A successful sync shows:
```
Feed Name: Fetched 50 prompts (12 new, 3 updated)
```

---

## Step 4: Manage Feeds

### View Feed Status

Each feed card displays:
- Feed name and type (API/RSS/Webhook)
- Source URL
- Active/Inactive badge
- Sync status (Success/Error/Pending)
- Last sync time
- Total prompts stored
- Error message (if failed)

### Feed Actions

- **Sync (↻):** Manually trigger a sync
- **Toggle (⚡/⏸):** Activate or deactivate feed
- **Delete (🗑):** Permanently remove feed (with confirmation)

---

## Supported Feed Formats

### JSON API Format

Your API endpoint should return an array of prompts:

```json
[
  {
    "id": "unique-prompt-id",
    "title": "Prompt Title",
    "content": "The actual prompt text...",
    "description": "Brief description of what this prompt does",
    "author": "Author Name (optional)",
    "category": "Category name (optional)",
    "tags": ["tag1", "tag2"],
    "difficulty": "beginner" | "intermediate" | "advanced",
    "source_url": "https://example.com/prompt/123"
  }
]
```

**Authentication Options:**
- Bearer token: Add to `auth_header` as `Authorization: Bearer YOUR_TOKEN`
- Custom header: Format as `Header-Name: value`

### RSS Feed Format

Standard RSS 2.0 with items:

```xml
<rss version="2.0">
  <channel>
    <item>
      <guid>unique-id</guid>
      <title>Prompt Title</title>
      <description>Prompt content...</description>
      <category>Category</category>
      <author>Author Name</author>
      <link>https://example.com/prompt</link>
    </item>
  </channel>
</rss>
```

---

## Example Feed Sources

### Public APIs
```
Name: Awesome ChatGPT Prompts
Type: API
URL: https://api.github.com/repos/f/awesome-chatgpt-prompts/contents/prompts
```

### RSS Feeds
```
Name: Prompt Engineering Guide
Type: RSS
URL: https://example.com/prompts/feed.xml
```

### Authenticated APIs
```
Name: Private Prompt Library
Type: API
URL: https://internal.company.com/api/prompts
Auth Header: X-API-Key: your-secret-key
```

---

## Troubleshooting

### "Connection Failed" Error

**Possible causes:**
- URL is incorrect or unreachable
- Authentication credentials are invalid
- Server returned non-200 status code
- Content type is not JSON or RSS/XML

**Solutions:**
1. Verify the URL in a browser
2. Check authentication credentials
3. Ensure the endpoint returns proper format
4. Try the "Test Connection" feature

### "Sync Failed" Error

**Possible causes:**
- Network timeout
- Invalid data format
- Missing required fields (title, content)

**Solutions:**
1. Check the "Last Sync Error" message for details
2. Verify the data format matches expected schema
3. Try syncing again (temporary network issues)

### "No Prompts Stored" (Despite Success)

**Possible causes:**
- Data format doesn't match expected schema
- Missing required fields

**Solutions:**
1. Review the JSON/RSS structure
2. Ensure `title` and `content` fields exist
3. Check browser console for parsing errors

---

## Best Practices

### Feed Configuration

1. **Test First:** Always test connection before creating
2. **Start with Public APIs:** Use well-known sources initially
3. **Set Reasonable Intervals:** Avoid syncing too frequently (60+ minutes)
4. **Monitor Status:** Check sync status regularly

### Feed Management

1. **Deactivate Unused Feeds:** Don't delete, just deactivate
2. **Regular Syncs:** Manually sync weekly or after source updates
3. **Error Monitoring:** Address sync errors promptly
4. **Feed Quality:** Only add high-quality, relevant sources

### Employee Experience

1. **Curate Carefully:** Add feeds relevant to your organization
2. **Diverse Sources:** Include different difficulty levels and categories
3. **Clear Naming:** Use descriptive feed names
4. **Communication:** Announce new feeds to employees

---

## Security Considerations

### API Keys

- Never commit API keys to version control
- Use environment variables for sensitive keys
- Rotate keys periodically
- Use read-only keys when possible

### Content Validation

- Review feeds before activating
- Monitor for inappropriate content
- Use trusted sources only
- Consider content moderation

### Rate Limiting

- Respect source API rate limits
- Set appropriate refresh intervals
- Avoid excessive manual syncs

---

## FAQ

### How often should I sync feeds?

**Recommended:** 60-120 minutes for active feeds, 24 hours for static feeds.

### Can employees edit external prompts?

**No.** External prompts are read-only. Employees can import them to their personal library, where they become editable copies.

### What happens when I delete a feed?

All prompts from that feed are permanently deleted. Employees who imported prompts will keep their copies.

### Can I have multiple feeds with the same URL?

**Yes**, but it's not recommended. Use descriptive names to differentiate.

### Do feeds auto-sync?

**Not yet.** Manual sync is required. Automated sync via Edge Functions is planned for future releases.

---

## Support

### Getting Help

- **In-App:** Click Help icon in Admin Settings
- **Documentation:** See `/docs/ADMIN_PROMPT_FEEDS_GUIDE.md`
- **Technical Issues:** Contact platform administrator

### Reporting Issues

When reporting feed sync issues, include:
1. Feed name and source URL
2. Error message (from "Last Sync Error")
3. Expected vs actual behavior
4. Steps to reproduce

---

## Appendix: Sample Feeds

### Community-Curated Lists

**Awesome ChatGPT Prompts**
```
URL: https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv
Type: API (requires CSV parser - future)
```

**Prompt Engineering Guide**
```
URL: https://www.promptingguide.ai/feed.xml
Type: RSS
```

### Internal Corporate Feeds

**Sales Enablement Prompts**
```
URL: https://internal.company.com/api/sales-prompts
Type: API
Auth: Bearer token
Categories: sales, outreach, negotiation
```

**Engineering Prompts**
```
URL: https://engineering.company.com/prompts/feed
Type: RSS
Categories: code-review, debugging, architecture
```

---

## Version History

- **v1.0** (January 2026) - Initial release
  - Manual feed configuration
  - Test connection feature
  - Manual sync
  - JSON and RSS support

---

**Questions?** Contact your OneEdge platform administrator.
