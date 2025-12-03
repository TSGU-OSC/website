# pfctl + dnctl

## Step-by-Step: Simulate Packet Loss on Loopback (lo0)
Enable packet filter (pf):

```bash
sudo pfctl -E
```
Configure a dummynet pipe:

Example: 5% packet loss and 100 ms delay:

```bash
sudo dnctl pipe 1 config plr 0.05 delay 100ms
```
Apply the pipe to both incoming & outgoing UDP on loopback:

```bash
echo "dummynet out on lo0 proto udp from any to any pipe 1" | sudo pfctl -f -
echo "dummynet in on lo0 proto udp from any to any pipe 1" | sudo pfctl -f -
```
This ensures both directions are affected 

Confirm it’s working:

```bash
sudo dnctl list
```
Or run your local UDP test (e.g., via FFmpeg)—you should see packet losses and delays.

Remove/flush when done:

```bash
sudo dnctl -q flush
sudo pfctl -F all
sudo pfctl -d
```

## Why This Works
dnctl configures the traffic shaping (packet loss, delay, bandwidth).

pfctl applies that shaping to loopback (lo0) UDP traffic.

The approach mirrors real-world network behaviors—packet drops and jitter—even when testing locally

> genreate by ChatGPT