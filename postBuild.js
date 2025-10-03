const fs = require('fs');
const path = require('path');

// Pfade definieren
const buildDir = path.join(__dirname, 'build');
const staticDir = path.join(buildDir, 'static');
const cssDir = path.join(staticDir, 'css');
const jsDir = path.join(staticDir, 'js');
const indexPath = path.join(buildDir, 'index.html');
const assetManifestPath = path.join(buildDir, 'asset-manifest.json');

console.log('Starting postBuild script...');

// Prüfe ob Build-Ordner existiert
if (!fs.existsSync(buildDir)) {
  console.error('Build-Ordner nicht gefunden. Führe zuerst "npm run build" aus.');
  process.exit(1);
}

// Funktion zum Finden und Umbenennen von Dateien
function renameFiles(dir, pattern, newName) {
  try {
    if (!fs.existsSync(dir)) {
      console.warn(`Verzeichnis nicht gefunden: ${dir}`);
      return null;
    }

    const files = fs.readdirSync(dir);
    console.log(`Suche in ${dir} nach Pattern: ${pattern.source}`);
    console.log(`Verfügbare Dateien: ${files.join(', ')}`);
    
    const matchingFiles = files.filter(file => pattern.test(file));
    
    if (matchingFiles.length === 0) {
      console.warn(`Keine Dateien gefunden für Pattern: ${pattern.source} in ${dir}`);
      return null;
    }

    const oldFileName = matchingFiles[0]; // Nimm die erste gefundene Datei
    const oldPath = path.join(dir, oldFileName);
    const newPath = path.join(dir, newName);
    
    // Wenn die Datei bereits den gewünschten Namen hat, überspringe
    if (oldFileName === newName) {
      console.log(`Datei hat bereits den gewünschten Namen: ${newName}`);
      return { oldName: oldFileName, newName: newName };
    }
    
    // Prüfe ob die Ziel-Datei bereits existiert und lösche sie
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(newPath);
      console.log(`Vorhandene Datei gelöscht: ${newName}`);
    }
    
    fs.renameSync(oldPath, newPath);
    console.log(`✅ Renamed: ${oldFileName} -> ${newName}`);
    
    return {
      oldName: oldFileName,
      newName: newName
    };
  } catch (error) {
    console.error(`❌ Fehler beim Umbenennen in ${dir}:`, error.message);
    return null;
  }
}

// Mapping der umbenannten Dateien
const renamedFiles = {};

// CSS-Dateien umbenennen
console.log('\n📁 Umbenennen der CSS-Dateien...');
const cssFile = renameFiles(cssDir, /^main\.[a-f0-9]+\.css$|^main\.css$/, 'main.css');
if (cssFile && cssFile.oldName !== cssFile.newName) {
  renamedFiles[cssFile.oldName] = cssFile.newName;
}

const cssMapFile = renameFiles(cssDir, /^main\.[a-f0-9]+\.css\.map$|^main\.css\.map$/, 'main.css.map');
if (cssMapFile && cssMapFile.oldName !== cssMapFile.newName) {
  renamedFiles[cssMapFile.oldName] = cssMapFile.newName;
}

// JS-Dateien umbenennen  
console.log('\n📁 Umbenennen der JS-Dateien...');
const jsFile = renameFiles(jsDir, /^main\.[a-f0-9]+\.js$|^main\.js$/, 'main.js');
if (jsFile && jsFile.oldName !== jsFile.newName) {
  renamedFiles[jsFile.oldName] = jsFile.newName;
}

const jsMapFile = renameFiles(jsDir, /^main\.[a-f0-9]+\.js\.map$|^main\.js\.map$/, 'main.js.map');
if (jsMapFile && jsMapFile.oldName !== jsMapFile.newName) {
  renamedFiles[jsMapFile.oldName] = jsMapFile.newName;
}

// LICENSE-Datei umbenennen (falls vorhanden)
const jsLicenseFile = renameFiles(jsDir, /^main\.[a-f0-9]+\.js\.LICENSE\.txt$|^main\.js\.LICENSE\.txt$/, 'main.js.LICENSE.txt');
if (jsLicenseFile && jsLicenseFile.oldName !== jsLicenseFile.newName) {
  renamedFiles[jsLicenseFile.oldName] = jsLicenseFile.newName;
}

// Wenn keine Dateien umbenannt wurden, trotzdem index.html prüfen
console.log('\n📝 Überprüfe index.html...');
console.log(`Umbenannte Dateien: ${Object.keys(renamedFiles).length > 0 ? JSON.stringify(renamedFiles, null, 2) : 'Keine'}`);

// index.html aktualisieren
try {
  let htmlContent = fs.readFileSync(indexPath, 'utf8');
  let htmlChanged = false;
  
  // Ersetze die Datei-Referenzen in der HTML
  Object.keys(renamedFiles).forEach(oldName => {
    const newName = renamedFiles[oldName];
    const oldPattern = new RegExp(oldName.replace(/\./g, '\\.'), 'g');
    if (htmlContent.includes(oldName)) {
      htmlContent = htmlContent.replace(oldPattern, newName);
      htmlChanged = true;
      console.log(`✅ HTML aktualisiert: ${oldName} -> ${newName}`);
    }
  });
  
  if (htmlChanged) {
    fs.writeFileSync(indexPath, htmlContent, 'utf8');
    console.log('✅ index.html erfolgreich aktualisiert');
  } else {
    console.log('ℹ️ index.html benötigt keine Aktualisierung');
  }
} catch (error) {
  console.error('❌ Fehler beim Aktualisieren der index.html:', error.message);
  process.exit(1);
}

// CSS-Map-Referenz in main.css aktualisieren (falls vorhanden)
console.log('\n🔗 Aktualisiere CSS-Map-Referenzen...');
try {
  const mainCssPath = path.join(cssDir, 'main.css');
  if (fs.existsSync(mainCssPath)) {
    let cssContent = fs.readFileSync(mainCssPath, 'utf8');
    let cssChanged = false;
    
    // Ersetze die Map-Referenz
    Object.keys(renamedFiles).forEach(oldName => {
      const newName = renamedFiles[oldName];
      if (oldName.endsWith('.css.map') && cssContent.includes(oldName)) {
        cssContent = cssContent.replace(new RegExp(oldName.replace(/\./g, '\\.'), 'g'), newName);
        cssChanged = true;
        console.log(`✅ CSS-Map aktualisiert: ${oldName} -> ${newName}`);
      }
    });
    
    if (cssChanged) {
      fs.writeFileSync(mainCssPath, cssContent, 'utf8');
      console.log('✅ CSS-Map-Referenzen erfolgreich aktualisiert');
    } else {
      console.log('ℹ️ CSS-Map-Referenzen benötigen keine Aktualisierung');
    }
  }
} catch (error) {
  console.error('❌ Fehler beim Aktualisieren der CSS-Map-Referenzen:', error.message);
}

// JS-Map-Referenz in main.js aktualisieren (falls vorhanden)
console.log('\n🔗 Aktualisiere JS-Map-Referenzen...');
try {
  const mainJsPath = path.join(jsDir, 'main.js');
  if (fs.existsSync(mainJsPath)) {
    let jsContent = fs.readFileSync(mainJsPath, 'utf8');
    let jsChanged = false;
    
    // Ersetze die Map-Referenz am Ende der Datei
    Object.keys(renamedFiles).forEach(oldName => {
      const newName = renamedFiles[oldName];
      if (oldName.endsWith('.js.map') && jsContent.includes(oldName)) {
        jsContent = jsContent.replace(new RegExp(oldName.replace(/\./g, '\\.'), 'g'), newName);
        jsChanged = true;
        console.log(`✅ JS-Map aktualisiert: ${oldName} -> ${newName}`);
      }
    });
    
    if (jsChanged) {
      fs.writeFileSync(mainJsPath, jsContent, 'utf8');
      console.log('✅ JS-Map-Referenzen erfolgreich aktualisiert');
    } else {
      console.log('ℹ️ JS-Map-Referenzen benötigen keine Aktualisierung');
    }
  }
} catch (error) {
  console.error('❌ Fehler beim Aktualisieren der JS-Map-Referenzen:', error.message);
}

// asset-manifest.json aktualisieren
console.log('\n📋 Aktualisiere asset-manifest.json...');
try {
  if (fs.existsSync(assetManifestPath)) {
    let manifestContent = fs.readFileSync(assetManifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);
    let manifestChanged = false;

    // Aktualisiere die "files" Einträge
    if (manifest.files) {
      Object.keys(renamedFiles).forEach(oldName => {
        const newName = renamedFiles[oldName];
        
        // Aktualisiere die Pfade in den files
        Object.keys(manifest.files).forEach(key => {
          if (manifest.files[key].includes(oldName)) {
            manifest.files[key] = manifest.files[key].replace(oldName, newName);
            manifestChanged = true;
            console.log(`✅ Manifest files aktualisiert: ${key} -> ${manifest.files[key]}`);
          }
        });

        // Aktualisiere die Keys selbst (für .map Dateien)
        if (manifest.files[oldName]) {
          manifest.files[newName] = manifest.files[oldName].replace(oldName, newName);
          delete manifest.files[oldName];
          manifestChanged = true;
          console.log(`✅ Manifest key umbenannt: ${oldName} -> ${newName}`);
        }
      });
    }

    // Aktualisiere die "entrypoints" Array
    if (manifest.entrypoints && Array.isArray(manifest.entrypoints)) {
      manifest.entrypoints = manifest.entrypoints.map(entrypoint => {
        let updatedEntrypoint = entrypoint;
        Object.keys(renamedFiles).forEach(oldName => {
          const newName = renamedFiles[oldName];
          if (updatedEntrypoint.includes(oldName)) {
            updatedEntrypoint = updatedEntrypoint.replace(oldName, newName);
            manifestChanged = true;
            console.log(`✅ Manifest entrypoint aktualisiert: ${entrypoint} -> ${updatedEntrypoint}`);
          }
        });
        return updatedEntrypoint;
      });
    }

    if (manifestChanged) {
      fs.writeFileSync(assetManifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      console.log('✅ asset-manifest.json erfolgreich aktualisiert');
    } else {
      console.log('ℹ️ asset-manifest.json benötigt keine Aktualisierung');
    }
  } else {
    console.log('ℹ️ asset-manifest.json nicht gefunden');
  }
} catch (error) {
  console.error('❌ Fehler beim Aktualisieren der asset-manifest.json:', error.message);
}

console.log('\n✅ PostBuild-Script erfolgreich abgeschlossen!');
console.log('📋 Finale Dateistruktur:');
console.log('   - CSS: /static/css/main.css');
console.log('   - CSS Map: /static/css/main.css.map');
console.log('   - JS: /static/js/main.js');
console.log('   - JS Map: /static/js/main.js.map');
console.log('   - JS License: /static/js/main.js.LICENSE.txt');
console.log('\n🎯 Alle Asset-Dateien haben jetzt konstante Namen, die sich nicht über die Zeit ändern!');
