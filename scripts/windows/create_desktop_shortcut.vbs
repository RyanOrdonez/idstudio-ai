Set oWS = WScript.CreateObject("WScript.Shell")
Set oFSO = WScript.CreateObject("Scripting.FileSystemObject")

' Get the current script directory and navigate to project root
scriptDir = oFSO.GetParentFolderName(WScript.ScriptFullName)
projectRoot = oFSO.GetParentFolderName(oFSO.GetParentFolderName(scriptDir))

' Create desktop shortcut path
sLinkFile = oWS.ExpandEnvironmentStrings("%USERPROFILE%") & "\Desktop\Launch IDStudio.ai.lnk"

' Create the shortcut
Set oLink = oWS.CreateShortcut(sLinkFile)
oLink.TargetPath = projectRoot & "\scripts\windows\start_app.bat"
oLink.WorkingDirectory = projectRoot
oLink.Description = "Launch IDStudio.ai development server"
oLink.WindowStyle = 1

' Try to set icon if it exists
iconPath = projectRoot & "\public\favicon.ico"
If oFSO.FileExists(iconPath) Then
    oLink.IconLocation = iconPath
End If

' Save the shortcut
oLink.Save

' Show success message
WScript.Echo "Desktop shortcut 'Launch IDStudio.ai' created successfully!" & vbCrLf & vbCrLf & "You can now double-click the shortcut on your desktop to launch the app."
