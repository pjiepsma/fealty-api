export const generateBlurHandler = async ({ input }: any) => {
  // Extract job inputs
  const { docId, collection } = input

  // Do your actual work here
  console.log(`Processing ${collection} document ${docId}`)

  // Dummy action: simulate some work
  await new Promise((resolve) => setTimeout(resolve, 1000))
  console.log(`✅ Successfully processed ${collection}/${docId}`)

  return {
    output: {
      message: `Successfully processed ${docId}`,
    },
  }
}
