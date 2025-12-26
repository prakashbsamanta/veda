module.exports = function (api) {
    api.cache(false); // Disable cache temporarily to ensure env vars update
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ['module:react-native-dotenv', {
                moduleName: '@env',
                path: '.env',
                blacklist: null,
                whitelist: null,
                safe: false,
                allowUndefined: true,
            }]
        ]
    };
};
