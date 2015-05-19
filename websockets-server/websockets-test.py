#!/usr/bin/env python
from sys import stdout
from sys import stdin
from time import sleep

for count in range(0, 5):
  print(count + 1)
  stdout.flush()
  sleep(1)

while True:
		for line in stdin:
		    print line
