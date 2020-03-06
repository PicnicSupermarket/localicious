# Localicious

localicious is a toolchain for working with localization files in a platform-agnostic way. With it, you can:

* Maintain all your localized copy and accessibility key/value pairs in one file, grouped per component.
* Verify the integrity of your base localization file against a schema
* Generate locale files for both Android and iOS from your base localization file

The goals of localicious are:

* **Copywriter-friendliness**
  
  Likewise, it should be easy for copywriters to change and add copy. For each string copywriters should be able to easily get an overview of the translations provided for the various languages.

* **Developer-friendliness**
  
  It should be easy for developers maintaining and developing features to work with the new system. They should be able to trust that the necessary copy will be there for any language. Moreover, the format in which the copy is delivered should be predictable to minimise dependencies between developers and copywriters in a fast-paced environment.

* **Robustness**

  One cannot blindly import localization files into the app and expect everything to work. Therefore, localicious enables both validation and conversion. Together, these two operations can support a robust workflow that minimises the potential for mistakes.

## Workflow

localicious assumes the following workflow:

1. You keep all your localizable strings in a YAML file that adheres to the structure defined by localicious.
2. When committed to a source repository, the YAML file is guaranteed to have passed localicious verification.
3. You point to the current working version of the YAML file in your iOS or Android project.
4. Using localicious, you generate the localization files when desired.

## Requirements and installation

localicious requires node 10.12.0 or later.

## The Localicipe

The central concept of localicious is the so-called Localicipe. It is a YAML file that contains all localized copy and accessibility strings grouped by platform, feature and screen:

```
IOS|ANDROID|SHARED:
  Feature:
    Screen:
      Element:
        COPY:
          en: "Translation for English speakers"
          nl: "Vertaling voor Nederlandstaligen"
        ACCESSIBILITY:
          HINT|LABEL|VALUE:
            en: "Accessibility for English speakers"
            nl: "Toegankelijkheid voor Nederlandstaligen"
      AnotherElement:
        COPY:
          ZERO|ONE|OTHER:
            en: "Plural translation for English speakers"
            nl: "Meervoudige vertaling voor Nederlandstaligen"
        ...
      ...
    ...
  ...
...
```

## Retrieving the Localicipe

If you are working with a team, you probably want to store your Localicipe in a Git repository and manage changes like you handle changes to your source code. Localicious supports that workflow. Simply create a repository that hosts your Localicipe. Then, in the root of the source repository of your Android or iOS project, you add the following `LocaliciousConfig.yaml`:

```
source:
  git:
    url: 'https://github.com/localicious/localicious-test.git'
languages:
  - en
  - nl
platforms:
  - IOS
  - ANDROID
```

To retrieve the latest version of the file in your repository, simply run `localicious install`. localicious also supports specifying a specific Git branch (by adding `:branch`).

## Converting the Localicipe

Consider the following Localicipe:

```
---
# Strings that are used in Android only
ANDROID:
  Checkout:
    OrderOverview:
      Total:
        COPY:
          en: 'Total price: %1{{s}}'  # This placeholder will expand to %1$@ on iOS and %1$s on Android
          nl: 'Totaal: %1{{s}}'
# Strings that are used in iOS only
IOS:
  Settings:
    PushPermissionsRequest:
      Title:
        COPY:
          en: 'Stay up to date'
          nl: 'Blijf op de hoogte'
# Strings that are shared between Android and iOS
SHARED:
  Delivery:
    Widget:
      Title:
        COPY:
          en: "Help"
          nl: "Help"
      SubTitle:
        COPY:
          ZERO:
            en: '%1{{d}} Pending order'
            nl: '%1{{d}} Lopende bestelling'
          ONE:
            en: '%1{{d}} Pending order'
            nl: '%1{{d}} Lopende bestelling'
          OTHER:
            en: '%1{{d}} Pending Orders'
            nl: '%1{{d}} Lopende bestellingen'
```

By running the following localicious command:

`localicious render ./copy.yaml ./output_path --platforms android --languages en`

We can generate a strings.xml file for Android with the English translations provided:

```
<?xml version="1.0" encoding="utf-8"?>
<resources>
  <string name="Checkout.OrderOverview.Total.COPY">Total price: %1$s</string>
  <string name="Delivery.Widget.Title.COPY">Help</string>
  <plurals name="Delivery.Widget.SubTitle.COPY">
    <item quantity="zero">%1$d Pending order</item>
    <item quantity="one">%1$d Pending order</item>
    <item quantity="other">%1$d Pending Orders</item>
  </plurals>
</resources>
```

A similar file with the Dutch translations will be created as well if we request localicious to do so:

`localicious render ./copy.yaml ./output_path --platforms android --languages en,nl`

By changing the destination, like so:

`localicious render ./copy.yaml ./output_path --platforms ios --languages en`

the following Localizable.strings file will be generated for iOS:

```
"Settings.PushPermissionsRequest.Title.COPY" = "Stay up to date";
"Delivery.Widget.Title.COPY" = "Help";
"Delivery.Widget.SubTitle.COPY.ZERO" = "%1$d Pending order";
"Delivery.Widget.SubTitle.COPY.ONE" = "%1$d Pending order";
"Delivery.Widget.SubTitle.COPY.OTHER" = "%1$d Pending Orders";
```

## Validating

Whenever we make changes to the Localicipe, it is important to verify that the format of the file is still correct. Imagine that we change the file in the previous example and add another entry for iOS:

```
Settings:
  PushPermissionsRequest:
    Subtitle:
      COPY
        en: 'Stay up to date'
```

Using the validation feature, we can validate whether the structure of the file is still correct after the change:

`localicious validate ./copy.yaml --required-languages en,nl`

Since we forgot to add a Dutch localization for the `Settings.PushPermissionsRequest.Subtitle.COPY` key, this will fail:

```
❌ Your Localicipe contains some issues.
```

localicious also supports the concept of optional languages. If we were to run the validator as follows:

`localicious validate ./copy.yaml --required-languages en --optional-languages nl`

the above file would pass validation even without the Dutch translation missing for some entries.
