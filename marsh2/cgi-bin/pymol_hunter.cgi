#!/data/conda/envs/apiEnv/bin/python

print "Content-type: text/html"
print
print "<pre>"

print "\n>>> import web"
try:
    import web

    print "\tName of Module: ", web.__name__
    print "\tSource location:", web.__file__
except:
    print "\tFailed to Import web!"

print "\n>>> web.application"
try:
    import web

    call = web.application
    print "\tApplication Module Found:", call
except:
    print "\tweb has no module 'application'! (Suspected to be pymol)"


print "\n>>> import pymol"
try:
    import pymol

    print "\tName of Module: ", pymol.__name__
    print "\tSource location:", pymol.__file__
except:
    print "\tFailed to Import pymol!"

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
