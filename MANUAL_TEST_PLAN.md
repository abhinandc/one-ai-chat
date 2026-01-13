# OneEdge - Manual Test Plan

**Date:** 2026-01-09
**Purpose:** Manual testing procedures for features requiring EdgeAdmin integration
**Tester:** Product team member with EdgeAdmin + OneEdge access

---

## Prerequisites

### Required Access

1. **EdgeAdmin Administrator Account**
   - Access to EdgeAdmin platform
   - Permission to create virtual keys
   - Permission to assign keys to employees

2. **OneEdge Employee Account**
   - Valid GSuite email (enterprise domain)
   - OneEdge login credentials
   - Access to OneEdge web app

3. **Test Environment**
   - Staging or production Supabase instance
   - Both EdgeAdmin and OneEdge pointing to same database
   - Google OAuth configured

---

## Test Suite 1: Virtual Keys - Model Loading

**Feature:** Models easily loaded via virtual keys (final-checks.md item #3)

**Goal:** Verify that when EdgeAdmin admin creates a virtual key and assigns it to an employee, the employee can immediately see and use that model in OneEdge.

### Test 1.1: Create Virtual Key in EdgeAdmin

**Steps:**

1. Login to EdgeAdmin as administrator
2. Navigate to "Virtual Keys" section
3. Click "Create New Virtual Key"
4. Fill in form:
   - **Name:** "Test GPT-4 Key - [Your Name]"
   - **Provider:** OpenAI
   - **Model:** gpt-4
   - **API Key:** [Valid OpenAI API key]
   - **Budget:** $10.00
   - **Rate Limit:** 100 requests/day
5. Click "Save"

**Expected Result:**
- ✅ Virtual key created successfully
- ✅ Status shows "Active"
- ✅ Key appears in EdgeAdmin virtual keys list

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach EdgeAdmin screenshot]_

---

### Test 1.2: Assign Virtual Key to Employee

**Steps:**

1. In EdgeAdmin, open the virtual key created in Test 1.1
2. Click "Assign to Employees"
3. Search for your OneEdge employee email
4. Select your employee
5. Click "Assign"
6. Verify assignment shows in "Assigned Employees" list

**Expected Result:**
- ✅ Employee assigned successfully
- ✅ Employee appears in assigned list
- ✅ Assignment status shows "Active"

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach assignment confirmation]_

---

### Test 1.3: Verify Model Appears in OneEdge

**Steps:**

1. Login to OneEdge (web app) with your employee account
2. Navigate to "Models Hub" (`/models`)
3. Look for "Test GPT-4 Key - [Your Name]" in model list

**Expected Result:**
- ✅ Virtual key appears in Models Hub
- ✅ Shows correct model name (gpt-4)
- ✅ Shows correct provider (OpenAI)
- ✅ Shows budget information ($10.00)
- ✅ Shows rate limit (100/day)
- ✅ Shows status "Active"

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach Models Hub screenshot]_

---

### Test 1.4: Use Model in Chat

**Steps:**

1. In OneEdge, navigate to Chat (`/chat`)
2. Click "New Conversation"
3. Open model selector dropdown
4. Verify "Test GPT-4 Key" appears in dropdown
5. Select "Test GPT-4 Key - [Your Name]"
6. Type test message: "Hello, what model are you?"
7. Send message

**Expected Result:**
- ✅ Model appears in dropdown
- ✅ Model can be selected
- ✅ Message sends successfully
- ✅ AI responds (GPT-4 confirms identity)
- ✅ No error messages
- ✅ Response appears in chat

**Actual Result:** _[Tester fills in]_

**Response Received:** _[Copy AI response]_

**Screenshot:** _[Attach chat screenshot]_

---

### Test 1.5: Verify Usage Tracking

**Steps:**

1. After completing Test 1.4, refresh Models Hub page
2. Look at "Test GPT-4 Key" card
3. Check usage statistics

**Expected Result:**
- ✅ Token count incremented (non-zero)
- ✅ Request count shows 1
- ✅ Cost calculated (> $0.00)
- ✅ Budget remaining decreased

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach updated Models Hub]_

---

### Test 1.6: Unassign Virtual Key

**Steps:**

1. Return to EdgeAdmin
2. Open "Test GPT-4 Key"
3. Find your employee in "Assigned Employees"
4. Click "Unassign" or "Remove"
5. Confirm removal

**Expected Result:**
- ✅ Employee removed from assigned list
- ✅ EdgeAdmin shows unassignment successful

**Actual Result:** _[Tester fills in]_

---

### Test 1.7: Verify Model Removed from OneEdge

**Steps:**

1. Return to OneEdge
2. Refresh Models Hub page
3. Look for "Test GPT-4 Key"

**Expected Result:**
- ✅ Virtual key NO LONGER appears in list
- ✅ OR shows status "Inactive"
- ✅ Key cannot be selected in chat model dropdown

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach Models Hub after removal]_

---

## Test Suite 2: Automations End-to-End

**Feature:** Automations working with EdgeVault credentials

### Test 2.1: Add Credential to EdgeVault

**Steps:**

1. Login to OneEdge
2. Navigate to Automations (`/automations`)
3. Click "Manage Credentials" or "EdgeVault" tab
4. Click "Add New Credential"
5. Fill in form:
   - **Integration:** Google
   - **Label:** "Test Gmail Credential"
6. Click "Connect with Google"
7. Complete OAuth flow
8. Verify credential saved

**Expected Result:**
- ✅ OAuth flow completes successfully
- ✅ Credential appears in EdgeVault list
- ✅ Status shows "Active"
- ✅ Last validated timestamp is recent

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach EdgeVault screenshot]_

---

### Test 2.2: Create Automation from Template

**Steps:**

1. In Automations page, click "Templates" tab
2. Find "Email Summarizer" template
3. Click "Use Template"
4. Fill in form:
   - **Name:** "Test Email Summarizer"
   - **Credential:** Select "Test Gmail Credential"
   - **Model:** Select any available model
   - **Schedule:** Daily at 9:00 AM
5. Click "Create"

**Expected Result:**
- ✅ Automation created successfully
- ✅ Appears in "My Automations" list
- ✅ Shows correct template name
- ✅ Shows credential selected
- ✅ Shows model selected
- ✅ Status shows "Enabled"

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach automation card]_

---

### Test 2.3: Test Automation Execution

**Steps:**

1. Open "Test Email Summarizer" automation
2. Click "Test Run" or "Run Now"
3. Wait for execution to complete (may take 10-30 seconds)
4. View execution result

**Expected Result:**
- ✅ Execution starts successfully
- ✅ Status shows "Running" during execution
- ✅ Execution completes (status "Completed" or "Failed")
- ✅ Result displayed (email summary or error message)
- ✅ Execution appears in execution history

**Actual Result:** _[Tester fills in]_

**Execution Output:** _[Copy output or error]_

**Screenshot:** _[Attach execution result]_

---

### Test 2.4: Verify Execution Logged

**Steps:**

1. Navigate to Dashboard (`/`)
2. Scroll to "Recent Activity" or "Activity Feed"
3. Look for automation execution event

**Expected Result:**
- ✅ Execution appears in activity feed
- ✅ Shows automation name
- ✅ Shows timestamp
- ✅ Shows status (success/failure)

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach activity feed]_

---

## Test Suite 3: Agents End-to-End

**Feature:** Agents working with N8N integration and custom builder

### Test 3.1: Create Custom Agent

**Steps:**

1. Navigate to Agents (`/agents`)
2. Click "Custom Agent Builder" tab
3. Click "Create New Agent"
4. Fill in form:
   - **Name:** "Test Customer Support Agent"
   - **Description:** "Helps draft customer support responses"
   - **Model:** Select any available model
5. Click "Create"
6. Agent builder opens

**Expected Result:**
- ✅ Agent created successfully
- ✅ Visual workflow builder loads
- ✅ Canvas is blank with "Add Node" button
- ✅ Node palette visible on left

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach agent builder]_

---

### Test 3.2: Build Agent Workflow

**Steps:**

1. Click "Add Node" in builder
2. Select "System" node
3. Set system prompt: "You are a helpful customer support agent. Draft professional responses."
4. Click "Add Node" again
5. Select "Tool" node
6. Connect System node to Tool node
7. Click "Save Workflow"

**Expected Result:**
- ✅ Nodes added successfully
- ✅ Nodes can be dragged
- ✅ Connection line appears between nodes
- ✅ Workflow saves without errors
- ✅ Success message appears

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach workflow diagram]_

---

### Test 3.3: Test Agent Execution

**Steps:**

1. Click "Test" button on agent card
2. Test modal opens
3. Enter test input: "Customer wants refund for damaged product. Order #12345."
4. Click "Execute"
5. Wait for response

**Expected Result:**
- ✅ Execution starts
- ✅ Loading indicator appears
- ✅ Response displays within 10 seconds
- ✅ Response is relevant (customer support draft)
- ✅ Metrics displayed (execution time, tokens used)

**Actual Result:** _[Tester fills in]_

**Agent Response:** _[Copy response]_

**Metrics:**
- Execution time: _[Fill in]_
- Tokens used: _[Fill in]_

**Screenshot:** _[Attach test result]_

---

### Test 3.4: Share Agent with Team

**Steps:**

1. Open "Test Customer Support Agent"
2. Click "Share" button
3. Toggle "Share with team" switch ON
4. Click "Save"

**Expected Result:**
- ✅ Share toggle updates
- ✅ "Shared" badge appears on agent card
- ✅ Success message appears

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach shared agent]_

---

### Test 3.5: N8N Workflow Sync (If N8N configured)

**Steps:**

1. Navigate to Agents → "N8N Workflows" tab
2. If N8N not configured:
   - Click "Configure N8N"
   - Enter N8N instance URL
   - Enter API key
   - Click "Connect"
3. If N8N configured:
   - Click "Sync Workflows"
4. Wait for sync to complete

**Expected Result:**
- ✅ N8N connection succeeds (or)
- ⚠️ N8N not configured (acceptable)
- ✅ Workflows list populates (if N8N configured)
- ✅ Workflow status shown (active/inactive)

**Actual Result:** _[Tester fills in]_

**N8N Status:** _[Configured / Not Configured]_

**Screenshot:** _[Attach N8N tab]_

---

## Test Suite 4: Prompt Library

**Feature:** Prompt library with CRUD operations and community features

### Test 4.1: Create Prompt

**Steps:**

1. Navigate to Prompt Library (`/prompts`)
2. Click "Create Prompt"
3. Fill in form:
   - **Title:** "Test Prompt - Email Subject Lines"
   - **Content:** "Generate 5 catchy email subject lines for: {{topic}}"
   - **Category:** Marketing
   - **Difficulty:** Beginner
   - **Variables:** Add variable "topic"
4. Click "Save"

**Expected Result:**
- ✅ Prompt created successfully
- ✅ Appears in prompt library
- ✅ Shows correct category badge
- ✅ Shows difficulty level

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach prompt card]_

---

### Test 4.2: Use Prompt with Variable

**Steps:**

1. Click on "Test Prompt - Email Subject Lines"
2. Click "Use Prompt"
3. Fill in variable:
   - **topic:** "Product Launch"
4. Click "Generate" or "Send to Chat"

**Expected Result:**
- ✅ Variable input field appears
- ✅ Prompt inserted into chat with variable replaced
- ✅ Chat shows: "Generate 5 catchy email subject lines for: Product Launch"
- ✅ AI generates response

**Actual Result:** _[Tester fills in]_

**AI Response:** _[Copy response]_

**Screenshot:** _[Attach chat with prompt]_

---

### Test 4.3: Like Prompt

**Steps:**

1. Return to Prompt Library
2. Find any prompt
3. Click heart/like icon

**Expected Result:**
- ✅ Like count increments
- ✅ Heart icon fills/changes color
- ✅ Like persists on page refresh

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach liked prompt]_

---

### Test 4.4: Search Prompts

**Steps:**

1. In Prompt Library, use search bar
2. Search for: "email"
3. View results

**Expected Result:**
- ✅ Search executes
- ✅ Results filtered to matching prompts
- ✅ Shows "Test Prompt - Email Subject Lines"
- ✅ Count shows number of results

**Actual Result:** _[Tester fills in]_

**Results Count:** _[Fill in]_

**Screenshot:** _[Attach search results]_

---

## Test Suite 5: Dashboard Metrics

**Feature:** Dashboard displays real usage metrics (no dummy data)

### Test 5.1: View Today's Stats

**Steps:**

1. Navigate to Dashboard (`/`)
2. Locate "Today's Stats" section
3. Review metrics

**Expected Result:**
- ✅ Messages sent count is real (matches your actual usage)
- ✅ Tokens used is non-zero if you've used chat
- ✅ Cost calculated based on actual usage
- ✅ Active time displayed

**Actual Result:**
- Messages sent: _[Fill in]_
- Tokens used: _[Fill in]_
- Cost: $_[Fill in]_
- Active time: _[Fill in]_

**Screenshot:** _[Attach today's stats]_

---

### Test 5.2: Verify Usage Trends Chart

**Steps:**

1. Locate "Usage Trends" chart on dashboard
2. Hover over data points

**Expected Result:**
- ✅ Chart displays with data
- ✅ Data matches your usage patterns
- ✅ Tooltips show specific values
- ✅ Chart is interactive (hover/click)

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach usage chart]_

---

### Test 5.3: Check Recent Activity Feed

**Steps:**

1. Scroll to "Recent Activity" section
2. Review activity entries

**Expected Result:**
- ✅ Activities listed in chronological order (newest first)
- ✅ Shows real events (conversations, automations, agent executions)
- ✅ Timestamps are accurate
- ✅ Clicking activity navigates to relevant page

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach activity feed]_

---

## Test Suite 6: UI/UX Compliance

**Feature:** UI matches hardUIrules.md specifications

### Test 6.1: Theme Switching

**Steps:**

1. Locate theme toggle (usually top-right corner)
2. Click to switch from light to dark mode
3. Observe all pages

**Expected Result:**
- ✅ Theme switches instantly
- ✅ All colors update correctly
- ✅ Text remains readable (contrast)
- ✅ No visual glitches
- ✅ Theme persists on page refresh

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach light mode + dark mode side-by-side]_

---

### Test 6.2: Responsive Layout (Desktop)

**Steps:**

1. Resize browser window to different widths:
   - 1920px (full HD)
   - 1440px (laptop)
   - 1280px (smaller laptop)
2. Observe layout adjustments

**Expected Result:**
- ✅ Layout responsive at all sizes
- ✅ No horizontal scrolling
- ✅ Text doesn't overflow
- ✅ Components reflow correctly

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach 3 different sizes]_

---

### Test 6.3: Animations Smooth

**Steps:**

1. Navigate between pages quickly
2. Open/close modals
3. Hover over interactive elements
4. Scroll through lists

**Expected Result:**
- ✅ Page transitions smooth (no jank)
- ✅ Modals animate open/close
- ✅ Hover effects instant
- ✅ Scrolling smooth (60fps feel)

**Actual Result:** _[Tester fills in, subjective assessment]_

**Frame Rate:** _[Use browser DevTools to measure]_

---

## Test Suite 7: Error Handling

**Feature:** Graceful error handling

### Test 7.1: Network Error

**Steps:**

1. Open browser DevTools
2. Switch to Network tab
3. Enable "Offline" mode
4. Try to send chat message

**Expected Result:**
- ✅ Error message displayed
- ✅ Message clear: "Network connection lost" or similar
- ✅ UI doesn't crash
- ✅ User can retry after going online

**Actual Result:** _[Tester fills in]_

**Error Message:** _[Copy message]_

**Screenshot:** _[Attach error state]_

---

### Test 7.2: Invalid Input

**Steps:**

1. Navigate to Automations
2. Try to create automation with empty name
3. Click "Save"

**Expected Result:**
- ✅ Validation error displayed
- ✅ Form doesn't submit
- ✅ Error message clear: "Name is required"
- ✅ Invalid field highlighted

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach validation error]_

---

### Test 7.3: Unauthorized Access

**Steps:**

1. Logout of OneEdge
2. Try to access `/chat` directly via URL
3. Observe behavior

**Expected Result:**
- ✅ Redirected to login page
- ✅ OR "Unauthorized" message displayed
- ✅ After login, redirected to intended page

**Actual Result:** _[Tester fills in]_

**Screenshot:** _[Attach redirect or error]_

---

## Test Results Summary

### Test Suite Completion

| Test Suite | Total Tests | Passed | Failed | Notes |
|------------|-------------|--------|--------|-------|
| 1. Virtual Keys | 7 | ___ | ___ | _[Notes]_ |
| 2. Automations | 4 | ___ | ___ | _[Notes]_ |
| 3. Agents | 5 | ___ | ___ | _[Notes]_ |
| 4. Prompt Library | 4 | ___ | ___ | _[Notes]_ |
| 5. Dashboard | 3 | ___ | ___ | _[Notes]_ |
| 6. UI/UX | 3 | ___ | ___ | _[Notes]_ |
| 7. Error Handling | 3 | ___ | ___ | _[Notes]_ |
| **TOTAL** | **29** | **___** | **___** | |

### Pass Criteria

- **Critical:** All Test Suite 1 (Virtual Keys) tests must pass
- **High Priority:** Test Suites 2-3 (Automations, Agents) should have ≥80% pass rate
- **Medium Priority:** Test Suites 4-7 should have ≥70% pass rate

### Sign-Off

**Tester Name:** _______________________

**Date Tested:** _______________________

**Environment:** _[Staging / Production]_

**Overall Status:** _[Pass / Fail / Pass with Issues]_

**Recommendation:**

- [ ] **Ready for Production** - All critical tests passed
- [ ] **Ready with Minor Issues** - Non-critical issues identified
- [ ] **Not Ready** - Critical issues found, requires fixes

**Additional Notes:**

_[Tester provides detailed feedback on issues found, UX observations, performance notes, etc.]_

---

**Document Created:** 2026-01-09
**Version:** 1.0
**Next Review:** After all tests completed
