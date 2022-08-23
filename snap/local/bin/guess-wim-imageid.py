#!/usr/bin/env python3

from sys import stdin, stdout
import xmltodict
import json

xmldata = xmltodict.parse(stdin.buffer, encoding='utf-16')
images = xmldata.get('WIM').get('IMAGE')

editions = { i.get('WINDOWS').get('EDITIONID') : i.get('@INDEX') for i in images }
print(editions.get('Professional'))
