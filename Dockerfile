FROM archlinux:latest

# sort mirror list for fastest download
RUN \
pacman -Syu --noconfirm sudo reflector && \
reflector --verbose --latest 100 --sort rate --save /etc/pacman.d/mirrorlist

# create tivoli sudo user without password
RUN \
useradd -m tivoli && usermod -L tivoli && \
echo "tivoli ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers && \
echo "root ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

USER tivoli
WORKDIR /home/tivoli

RUN \ 
# install yay
sudo pacman -Syu --noconfirm base-devel sudo git && \
git clone https://aur.archlinux.org/yay.git && \
cd yay && makepkg -si --noconfirm && \
cd .. && rm -rf yay

# install janus gateway
RUN yay -Syu --noconfirm janus-gateway

# install desktop
RUN yay -Syu --noconfirm xf86-video-vesa mesa xorg-server-xvfb xdotool dbus pulseaudio
RUN yay -Syu --noconfirm ttf-roboto openbox google-chrome xdg-utils xterm
# gnome-shell gnome-terminal nautilus

# install chrome extensions
COPY ./config/install-chrome-ext.sh /etc/tivoli-shared-desktop/install-chrome-ext.sh
RUN cd /etc/tivoli-shared-desktop && \ 
sudo ./install-chrome-ext.sh "cjpalhdlnbpafiamejdnhcphjbkeiagm" "uBlock Origin" && \
sudo ./install-chrome-ext.sh "gphhapmejobijbbhgpjhcjognlahblep" "GNOME Shell integration" && \
sudo ./install-chrome-ext.sh "ghbmnnjooekpmoecnnnilnnbdlolhkhi" "Google Docs Offline" && \
sudo ./install-chrome-ext.sh "gbkeegbaiigmenfmjfclcdgdpimamgkj" "Office Editing for Docs, Sheets & Slides"

# install gstreamer
RUN yay -Syu --noconfirm gstreamer gst-plugins-base gst-plugins-good gst-plugins-ugly

# install all other 
RUN yay -Syu --noconfirm nodejs npm yarn caddy
RUN sudo npm i -g pm2 

# copy janus config
COPY ./config/janus.jcfg /etc/janus
COPY ./config/janus.plugin.streaming.jcfg /etc/janus
# COPY ./config/janus.plugin.textroom.jcfg /etc/janus

# copy tivoli shared desktop config
COPY ./config/ecosystem.config.js /etc/tivoli-shared-desktop/ecosystem.config.js 
COPY ./config/Caddyfile /etc/tivoli-shared-desktop/Caddyfile 
COPY ./config/stream.sh /etc/tivoli-shared-desktop/stream.sh
COPY ./app /etc/tivoli-shared-desktop/app

# add vars
RUN \
sudo bash -c "echo 'DISPLAY=:1' >> /etc/environment" && \
sudo bash -c "echo 'XDG_RUNTIME_DIR=/run/user/1000' >> /etc/environment" && \
sudo mkdir -p /var/run/dbus && \
# user
sudo mkdir -p /run/user/1000 && \
sudo chown tivoli:tivoli /run/user/1000 && \
# machine id
sudo rm -f /etc/machine-id /var/lib/dbus/machine-id && \
sudo dbus-uuidgen --ensure=/etc/machine-id && \
sudo dbus-uuidgen --ensure && \
# make google chrome default
sudo xdg-mime default google-chrome-stable.desktop x-scheme-handler/http && \
sudo xdg-mime default google-chrome-stable.desktop x-scheme-handler/https && \
sudo xdg-mime default google-chrome-stable.desktop text/html

ENV DISPLAY=:1
ENV XDG_RUNTIME_DIR=/run/user/1000

ENV HOST_WIDTH=1366
ENV HOST_HEIGHT=768

# run config with pm2
RUN cd /etc/tivoli-shared-desktop/app && sudo yarn
CMD sudo -E pm2-runtime start /etc/tivoli-shared-desktop/ecosystem.config.js