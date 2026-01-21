## PDF Issue

 Issue Documentation: PDF/Document Processing Not Working

  Status: UNRESOLVED
  Attempts: v43, v44, v45 deployments
  User Impact: Unable to process PDF documents with Claude Opus 4.1

  Problem Summary

  When uploading PDFs to Claude Opus 4.1, the AI responds that it cannot access/read the document content, despite the request returning 200 OK.

  Root Cause (Suspected)

  The internal OCR call to OneAI (https://api-oneai.oneorigin.us/v1/chat/completions with model op3) is failing silently. The error message gets embedded in the content sent to Claude, which then says "I can't access the document."

  What Was Tried

  1. v43: Fixed OneAI endpoint from /api/llm/v1/chat/completions to /v1/chat/completions, changed auth from Authorization: Bearer to X-API-Key
  2. v44: Added enhanced logging to trace OCR processing
  3. v45: Fixed vision detection for Claude 4.x, added Anthropic image format conversion

  What Needs Investigation

  - Verify OneAI API key (oo-370b...) is valid and active
  - Test the OCR endpoint directly to confirm it works
  - Check if op3 model is the correct model name for olmOCR

  User's Request

  Stop further attempts until the OneAI/OCR integration can be properly debugged with access to the actual API documentation or direct testing.

  ---
  I'm sorry for the repeated failures. The core issue appears to be the OneAI OCR service, which needs direct verification outside of this proxy code.
