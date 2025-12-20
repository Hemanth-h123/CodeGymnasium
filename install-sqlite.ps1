# PowerShell script to download and install SQLite3

Write-Host "Downloading SQLite3 for Windows..." -ForegroundColor Yellow

# Create directory for SQLite
$sqliteDir = "C:\sqlite"
if (!(Test-Path $sqliteDir)) {
    New-Item -ItemType Directory -Path $sqliteDir | Out-Null
}

# Download SQLite3 precompiled binaries for Windows
$url = "https://www.sqlite.org/2023/sqlite-tools-win32-x86-3420000.zip"
$zipFile = "$sqliteDir\sqlite.zip"

try {
    Invoke-WebRequest -Uri $url -OutFile $zipFile
    Write-Host "Download completed successfully." -ForegroundColor Green
    
    # Extract the zip file
    Expand-Archive -Path $zipFile -DestinationPath $sqliteDir -Force
    Write-Host "Extraction completed." -ForegroundColor Green
    
    # Clean up the zip file
    Remove-Item $zipFile
    
    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
    if ($currentPath -notlike "*$sqliteDir*") {
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$sqliteDir", "Machine")
        Write-Host "Added SQLite3 to system PATH. You may need to restart your terminal/command prompt." -ForegroundColor Green
    } else {
        Write-Host "SQLite3 is already in PATH." -ForegroundColor Green
    }
    
    Write-Host "SQLite3 installation completed!" -ForegroundColor Green
    Write-Host "Please close and reopen your terminal/command prompt to use sqlite3 command." -ForegroundColor Yellow
    
} catch {
    Write-Host "Error downloading SQLite3: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You can manually download SQLite3 from https://www.sqlite.org/download.html" -ForegroundColor Yellow
}
