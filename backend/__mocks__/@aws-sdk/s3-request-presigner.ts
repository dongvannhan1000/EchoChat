// Mock for @aws-sdk/s3-request-presigner
export const getSignedUrl = jest.fn().mockImplementation(() => {
return Promise.resolve('https://test-bucket.s3.amazonaws.com/test-presigned-url');
});