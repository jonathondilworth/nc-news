const { toBeValidAPIEndpoint, toBeValidRequestMethod } = require("./helpers/custom");

describe('toBeValidAPIEndpoint', () => {

    test('should return true when provided with a valid api endpoint string', () => {
        // arrange
        const validInputs = [
            '/api',
            '/api/topics',
            '/api/articles',
            '/api/articles/:article_id',
            '/api/articles/:article_id/comments',
            '/api/comments/:comment_id',
            '/api/users',
            '/api/users/:username',
            '/api/test/:multiple/parametric/:arguments',
            '/api/endpoint/with-hyphens-within/the-endpoint'
        ];
        // act
        validInputs.forEach((input) => {
            // assert
            expect(toBeValidAPIEndpoint(input)).toMatchObject({
                pass: true
            });
        });
    });

    test('should return false when provided with an invalid api endpoint string', () => {
        // arrange
        const invalidInputs = [
            'a simple string',
            '/does/not/start/with/api',
            '/api/with/a/trailing/forward/slash/',
            '/api/with/a/trailing/hyphen-end-the-endpoint-',
        ];
        // act
        invalidInputs.forEach((input) => {
            // assert
            expect(toBeValidAPIEndpoint(input)).toMatchObject({
                pass: false
            });
        });
    });

}); // Describe: toBeValidAPIEndpoint

describe('toBeValidRequestMethod', () => {
    
    test('should return true when provided with a valid request method', () => {
        // arrange
        const validRequestMethods = ['get', 'post', 'patch', 'put', 'delete', 
                                     'GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
        // act
        validRequestMethods.forEach((method) => {
            // assert
            expect(toBeValidRequestMethod(method)).toMatchObject({
                pass: true
            });
        });        
    });
    
    test('should return false when provided with an invalid request method', () => {
        // arrange
        const invalidRequestMethods = ['these', 'are', 'not', 'valid', 'request', 'methods'];
        // act
        invalidRequestMethods.forEach((method) => {
            // assert
            expect(toBeValidRequestMethod(method)).toMatchObject({
                pass: false
            });
        });
    });

}); // Describe: toBeValidRequestMethod