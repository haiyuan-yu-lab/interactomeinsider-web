#!/usr/bin/env /data/conda-marshmallow/bin/python

import subprocess
import os

print "Content-type: text/html"
print
print "<pre>"

try:
    print 'selinux status:', subprocess.check_output('/usr/sbin/getenforce')
except Exception as e:
    print e


print "\n>>> import web"
try:
    import web

    print "\tName of Module: ", web.__name__
    print "\tSource location:", web.__file__
except:
    print "<span style='color:red;'>\tFailed to Import web!</span>"

print "\n>>> web.application"
try:
    import web

    call = web.application
    print "\t", call
except:
    print "<span style='color:red;'>Web has no module 'application'! (Suspected to be pymol)</span>"


print "\n>>> import pymol"
try:
    import pymol

    print "\tName of Module: ", pymol.__name__
    print "\tSource location:", pymol.__file__
except:
    print "<span style='color:green;'>\tFailed to Import pymol! (This is good!)</span>"

print "\n>>> import MySQLdb"
try:
    import MySQLdb

    print "\tName of Module: ", MySQLdb.__name__
    print "\tSource location:", MySQLdb.__file__
except:
    print "<span style='color:red;'>\tFailed to Import MySQLdb!</span>"


print "\n>>> import numpy"
try:
    import numpy

    print "\tName of Module: ", numpy.__name__
    print "\tSource location:", numpy.__file__
except:
    print "<span style='color:red;'>\tFailed to Import numpy!</span>"


print "\n>>> import scipy"
try:
    import scipy

    print "\tName of Module: ", scipy.__name__
    print "\tSource location:", scipy.__file__
except:
    print "<span style='color:red;'>\tFailed to Import scipy!</span>"


print "\n>>> import sqlalchemy"
try:
    import sqlalchemy

    print "\tName of Module: ", sqlalchemy.__name__
    print "\tSource location:", sqlalchemy.__file__
except:
    print "<span style='color:red;'>\tFailed to Import sqlalchemy!</span>"


print "\n>>> import jupyter"
try:
    import jupyter

    print "\tName of Module: ", jupyter.__name__
    print "\tSource location:", jupyter.__file__
except:
    print "<span style='color:red;'>\tFailed to Import jupyter!</span>"

print "\n>>> import pandas"
try:
    import pandas

    print "\tName of Module: ", pandas.__name__
    print "\tSource location:", pandas.__file__
except:
    print "<span style='color:red;'>\tFailed to Import pandas!</span>"


import imp
import os
MODULE_EXTENSIONS = ('.py', '.pyc', '.pyo')


def package_contents(package_name):
    file, pathname, description = imp.find_module(package_name)
    if file:
        raise ImportError('Not a package: %r', package_name)
    # Use a set because some may be both source and compiled.
    return set([os.path.splitext(module)[0]
                for module in os.listdir(pathname)
                if module.endswith(MODULE_EXTENSIONS)])


print "\n\nPackage contents of 'web' module:", package_contents('web'), '\n\n'

import sys
from cgi import escape
print "<strong>Python %s</strong>" % sys.version
keys = os.environ.keys()
keys.sort()
for k in keys:
    print "%s\t%s" % (escape(k), escape(os.environ[k]))
print "</pre>"
