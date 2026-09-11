const {withMainApplication,withProjectBuildGradle,withAppBuildGradle}=require('@expo/config-plugins');
const fs=require('fs'),path=require('path');
module.exports=function withAs608(config){
 config=withMainApplication(config,config=>{const p=config.modResults.contents;
  let out=p;
  if(!out.includes('com.as608.reactnative.AS608Package')) out=out.replace(/(package\s+[^\n]+\n)/,'$1import com.as608.reactnative.AS608Package\n');
  if(!out.includes('AS608Package()')) out=out.replace(/(PackageList\(this\)\.packages)/,'$1.apply { add(AS608Package()) }');
  config.modResults.contents=out; return config;});
 config=withProjectBuildGradle(config,config=>{let c=config.modResults.contents;if(!c.includes('mavenCentral()')) c=c.replace(/repositories\s*\{/, 'repositories {\n        mavenCentral()');config.modResults.contents=c;return config;});
 config=withAppBuildGradle(config,config=>{let c=config.modResults.contents;if(!c.includes('sourceSets.main.java.srcDirs')) c += `\nandroid {\n    sourceSets { main { java.srcDirs += ['../../native/android'] } }\n}\n`;config.modResults.contents=c;return config;});
 return config;
}
