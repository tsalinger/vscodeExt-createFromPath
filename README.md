# Create from Path README

Creates a file or folder and all its parent folders given a path string e.g. 'src/main/java/Main.java' will create the following path:<br/>
<pre>
\---src
    \---main
        \---java
                Main.java
</pre>

## Creating Folders or a File
Creating directories only: Terminate your string with a (back-)slash, e.g. <code>'src/main/java/'</code>.<br/>
Creating a file: Don't terminate your string with a (back-)slash, e.g. <code>'src/main/java/Main.java'</code>.

## Launch Options
There are two ways to launch this extension:
1. **File explorer**: Right click on a file/folder and choose <code>'Create from Path'</code>. The new path will be created in that place.
2. **'Create from Path' command**. If you use the command while having a file open, the new path will be created there. Otherwise, it will be created in the root folder of the currently open workspace. A workspace picker is shown in case of multiple open workspaces.

## Release Notes


### 1.0.0

Initial release