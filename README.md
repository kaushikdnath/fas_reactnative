# Clean Android buid

npx expo prebuild --clean

# Build with android native

npx expo run:android

# Build the native Android app once and installs the development APK on your phone.

npx expo prebuild -p android
npx expo run:android

# Start Metro

npx expo start --dev-client

# Incase reconnecting and app don't connect

adb reverse tcp:8081 tcp:8081

# Emoji unicode repo

https://unicode.org/emoji/charts/full-emoji-list.html

# EAS Login

eas init --id 193bb9e1-324d-4391-b4c1-3aa353d6a24d

# EAS build for the development

eas build --platform android --profile development

# EAS build for the preview

eas build --platform android --profile preview

# EAS update

eas update:configure
eas update --branch development --message "Initial development update" --platform=android
