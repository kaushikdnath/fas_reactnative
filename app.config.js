const profile = process.env.EAS_BUILD_PROFILE || "development";

const configs = {
  development: {
    name: "Ankit FAS Dev",
    package: "com.kaushikdnath.ankitfas.dev",
    channel: "development",
  },

  preview: {
    name: "Ankit FAS Preview",
    package: "com.kaushikdnath.ankitfas.preview",
    channel: "preview",
  },

  production: {
    name: "Ankit FAS",
    package: "com.kaushikdnath.ankitfas",
    channel: "production",
  },
};

const config = configs[profile];

module.exports = {
  expo: {
    name: config.name,
    slug: "ankit-fas",

    android: {
      package: config.package,
    },

    updates: {
      url: "https://u.expo.dev/193bb9e1-324d-4391-b4c1-3aa353d6a24d",
    },

    runtimeVersion: {
      policy: "appVersion",
    },

    extra: {
      eas: {
        projectId: "193bb9e1-324d-4391-b4c1-3aa353d6a24d",
      },
    },
  },
};
