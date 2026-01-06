/**
 * Reusable runner for generate-blur job
 * @description Extracted so we can call from API route or the Task handler.
 * Source: https://dev.to/aaronksaunders/run-payload-jobs-on-vercel-serverless-step-by-step-migration-aj9
 */
export const runGenerateBlur = async () => {
  const timestamp = new Date().toISOString()
  console.log(`[TASK] Generate blur job started at ${timestamp}`)

  // Dummy action: simulate some work
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log(`✅ [TASK] Generate blur job completed successfully`)

  return {
    output: {
      success: true,
      timestamp,
      message: 'Generate blur job completed successfully',
    },
  }
}

/**
 * Handler for Payload CMS task (not used in serverless)
 */
export const generateBlurHandler = async () => {
  return runGenerateBlur()
}
