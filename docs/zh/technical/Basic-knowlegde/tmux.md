# A Beginner’s Guide to tmux: Simple Usage for Session Management
If you’re looking to improve your terminal workflow, tmux is a must-have tool. tmux is a terminal multiplexer that allows you to manage multiple terminal sessions from one window. In this guide, we’ll cover the basics such as creating, deleting, and switching tmux sessions, as well as how to enable scrolling to view your terminal’s content history.

## What is tmux?
tmux stands for terminal multiplexer. It allows you to run and manage multiple terminal sessions inside a single terminal window. This is especially useful for long-running processes, multitasking, or keeping your work organized when switching between projects. With tmux, you can detach from a session and reattach later without interrupting your running processes.

## Installing tmux
Before getting started, you need to install tmux. On most Linux distributions and macOS, you can install tmux using your package manager. For example:

Ubuntu/Debian:

```shell
sudo apt-get update
sudo apt-get install tmux
```
Fedora:

```shell
sudo dnf install tmux
```

macOS (using Homebrew):
```shell
brew install tmux
```

Once installed, you can check your version by running:

```shell
tmux -V
```
## Creating a tmux Session
To start a new tmux session, simply type:

```shell
tmux new -s mysession
```
Here, mysession is the name of your new session. Naming sessions makes it easier to manage multiple sessions later.

## Switching Between Sessions
After creating multiple sessions, you can switch between them without closing any. First, list all your active sessions:

```shell
tmux ls
```
Then, attach to the session you want:

```shell
tmux attach -t mysession
```
If you’re already inside a tmux session and want to create or switch sessions, you can use tmux’s built-in commands. Press Ctrl+b (the default prefix), then type : to bring up the command prompt. For example, typing:

```shell
switch-client -t mysession
```
will switch you to the session named mysession.

## Deleting (Killing) a tmux Session
When you’re done with a session, you can kill it to free up resources. To kill a session, first list the sessions:

```shell
tmux ls
```

Then, use the kill-session command:

```shell
tmux kill-session -t mysession
```
Alternatively, if you are inside the session you want to close, simply type:

```shell
exit
```
This will terminate the session.

## Enabling Scroll in tmux
One of the advantages of tmux is that it lets you scroll through previous terminal output. To enable scrolling:

`Enter Copy Mode`: Press Ctrl+b then [ (the square bracket). This puts you in copy mode.

`Scroll`: You can now use the arrow keys or Page Up/Page Down keys to navigate the scrollback history.

`Exit Copy Mode`: Press q to exit copy mode.

You can also customize the scrollback buffer size by adding this line to your tmux configuration file (~/.tmux.conf):

```shell
set-option -g history-limit 10000
```
This example increases the history limit to 10,000 lines.

## Additional Tips
Splitting Windows: You can split your tmux window vertically using Ctrl+b then % and horizontally using Ctrl+b then ". This allows you to have multiple panes in a single session.

Resizing Panes: Hold Ctrl+b then press and hold one of the arrow keys to resize the active pane.

Customization: tmux is highly customizable. Explore your ~/.tmux.conf to personalize keybindings, colors, and other settings.

