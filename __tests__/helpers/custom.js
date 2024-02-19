/**
 * Regex:
 * 1. the endpoint must begin with /api
 * 2. /api may be followed by a slash, if (and only if) that slash is followed by another string
 * 3. strings following /api/* may be hyphenated OR may represent parametric endpoints (preceed with a :)
 * 4. endpoints (for the purposes of being included within documentation) must not end with a trailing slash
 */
exports.toBeValidAPIEndpoint = (expectParam) => {
    const regex = /^\/api(?:\/(?:[\w-]+(?<=\w)|:[\w-]+(?<=\w)))*(?!\/)$/g;
    const pass = regex.test(expectParam);
    return {
        message: () => {
            return `expected ${expectParam} to be of valid API endpoint form: see: ${regex}`;
        },
        pass
    };
};

exports.toBeValidRequestMethod = (expectParam) => {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    const pass = methods.includes(expectParam.toLowerCase());
    return {
        message: () => {
            return `expected ${expectParam} to be either ${methods.join(", ")}`;
        },
        pass
    }
};

/**
 * TODO: Implement custom matcher: isValidUrl (optional)
 */