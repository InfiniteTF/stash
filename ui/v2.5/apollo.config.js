module.exports = {
    client: {
        service: {
            name: 'stash-box',
            url: 'http://stashdb.org/graphql',
        },
        excludes: ['**/queries/**/_*', '**/mutations/**/_*', '**/__tests__/**/*', '**/node_modules']
    }
};
