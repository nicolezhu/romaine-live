#!/usr/bin/env bash

apt-get install -y python-pip
pip install virtualenv
pip install virtualenvwrapper
mkdir /home/vagrant/env
chown vagrant:vagrant /home/vagrant/env
echo ". /usr/local/bin/virtualenvwrapper.sh" >> /home/vagrant/.bashrc
echo "export WORKON_HOME=~/env" >> /home/vagrant/.bashrc
