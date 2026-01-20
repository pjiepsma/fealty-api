---
description: "Never guess - only provide factual, proven information"
alwaysApply: true
---

# No Guessing Rule

## Core Principle

**Every statement must be factual, proven, and evidence-based. NEVER guess, speculate, or assume.**

## Requirements

1. **All solutions must be backed by evidence:**
   - Actual error messages from logs
   - Code analysis showing the exact problem
   - Documentation or examples proving the fix
   - Runtime data confirming the issue

2. **Forbidden language:**
   - "might be" / "could be" / "perhaps" / "maybe" / "likely" / "probably"
   - "this should work" / "this might fix it"
   - "unreliable" / "problematic" without proof
   - Any speculative statements

3. **When investigating errors:**
   - Read the exact error message
   - Check the code at the error location
   - Verify against documentation
   - Compare with working examples in codebase
   - Only then provide a solution

4. **If you don't know:**
   - State: "I need to investigate this further"
   - Request specific information needed
   - Suggest debugging steps to gather evidence
   - Do NOT provide speculative solutions

## Example

**BAD:** "This might be a timezone issue" or "The query could be unreliable"

**GOOD:** "The error 'Parameter "obj" to Document() must be an object, got "" (type string)' at line 14 indicates an empty string is being passed to MongoDB. Checking the query structure shows..."
