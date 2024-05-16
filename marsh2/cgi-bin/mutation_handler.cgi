#!/usr/bin/env /data/conda-marshmallow/bin/python

import sys
import os
import cgi
sys.stderr = sys.stdout
import cgitb
cgitb.enable()
import random
import string


def generate_code():
    return ''.join(['MC'] + random.sample(string.uppercase, 3) + random.sample(string.digits, 2) + random.sample(string.letters + string.digits, 5))

#Grab all the inputs from CGI
form = cgi.FieldStorage()
fh = form['mutation_file']

group_name = form.getfirst('disease_group_name')
user_name = generate_code()
email = form['email'].value if "email" in form else ''

prefix = '/data/web-vhosts/marsh2/cgi-bin/LOR_calculation/'


filename = prefix + user_name + '_' + group_name + '.txt'
efilename = prefix + user_name + '_' + group_name + '_email.txt'


# EDITED: 2021_04_01 by Shayne Wierbowski
# Added compatibility for csv format
# Added checks for valid input and a separate error page
# if invalid input detected
valid_input = True
with open(filename, 'w') as f:
    lines = text = fh.file.read().split("\n")
    for l in lines:
        if(l == ""):
            continue

        # Treat data as either tab separated or comma separated
        # depending on best reasonable guess
        if("," in l and not "\t" in l):
            l = l.replace(",", " ")
        else:
            l = l.replace("\t", " ")
        
        # Split and re-join line by space delimiter
        # Handles error that can occur downstream
        # if there are somehow extra spaces
        l = " ".join(l.split())
        
        # Write each line to output
        f.write(l.strip() + "\n")

        try:
            # Check that row matches expectation
            row = l.strip().split()

            # 1. Should be four columns
            if(len(row) != 4):
                valid_input = False

            # 2. Column 2 should be an int
            if(not row[1].isdigit()):
                valid_input = False

            # 3. Columns 3 and 4 should be one character
            if(len(row[2]) != 1 or len(row[3]) != 1):
                valid_input = False
        # This shouldn't happen. Added as a catch all to so that page can't possibly crash from bad input?
        except:
            continue

with open(efilename, 'w') as f:
    f.write(email)


if(valid_input):
    os.system("/data/conda-marshmallow/bin/python /data/web-vhosts/marsh2/cgi-bin/LOR_calculation/LOR_add.py {0} {1} & ".format(user_name, group_name))


# Couldn't figure out how to successfully format this string to include
# a separate error or success message in the body so we do if the stupid
# way and have two separate copies of the whole output
if(valid_input):
    output =  """
<head>
    <link rel="icon" href="../img/icon.png" type="image/x-icon" />
    <link rel="stylesheet" href="../css/jquery-ui.min.css">
    <link rel="stylesheet" href="../css/jquery-ui.structure.min.css">
    <link rel="stylesheet" href="../css/jquery-ui.theme.min.css">
    <link rel="stylesheet" href="../css/font-awesome-4.6.3/css/font-awesome.min.css">
    <link rel="stylesheet" href="../js/chosen.min.css">
    <script src="../js/jquery-1.11.3.min.js"></script>
    <script src="http://code.jquery.com/color/jquery.color-2.1.2.min.js" integrity="sha256-H28SdxWrZ387Ldn0qogCzFiUDDxfPiNIyJX7BECQkDE=" crossorigin="anonymous"></script>
    <script src="http://d3js.org/d3.v3.min.js"></script>
    <script src="../js/bootstrap.min.js"></script>
    <script src="../js/jquery-ui.min.js"></script>
    <script src='../js/chosen.jquery.min.js'></script>
    <title>Success - Interactome INSIDER</title>
</head>
<style>
h1 {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 24px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 300;
    line-height: 26.4px;
}

h3 {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 500;
    line-height: 15.4px;
}

p,
body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 400;
    line-height: 20px;
}

blockquote {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 21px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 400;
    line-height: 30px;
}

pre {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 400;
    line-height: 18.5714px;
}

hr {
    border: none;
    height: 4px;
    /* Set the hr color */
    color: #666;
    /* old IE */
    background-color: #666;
    /* Modern Browsers */
}

body {
    padding: 0;
    margin: 0;
}

.header_link {
    background-color: #ccc;
    padding: 5px;
    padding-right: 10px;
    padding-left: 10px;
    float: right;
    margin-top: 24px;
    margin-right: 10px;
    margin-left: 10px;
    color: #666;
    text-decoration: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.img_container {
    width: 1366px;
    height: 320px;
    border-bottom: 4px solid #666;
}

.img_tagline {
    margin-top: 10px;
}

.header_panel {
    width: 340px;
    float: left;
    text-align: center;
    position: relative;
}

.info_panel {
    width: 340px;
    height: 220px;
    float: left;
    text-align: justify;
}

.header_pic {
    margin-top: 20px;
}

.info_container {
    width: 1366px;
    float: left;
    height: 190px;
    background-color: #ff9999;
    border-bottom: 4px solid #666;
    overflow: hidden;
}

.info_link {
    background-color: #666;
    border: 3px solid #666;
    color: white;
    padding: 4px;
    text-decoration: none;
    position: absolute;
    bottom: -30;
    padding-right: 10px;
    padding-left: 10px;
    z-index: 200;
    cursor: pointer;
    font-size: 12px;
    /*    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;*/
}

.main_textarea {
    height: 500px;
    width: 500px;
    background-color: #ddd;
    border: 2px solid #666;
    margin: 10px;
    float: left;
    margin-top: 50px;
}

#description {
    height: 500px;
    margin-left: 50px;
    float: left;
    margin-top: 50px;
}

#text_desc {
    width: 500px;
    text-align: justify;
    line-height: 8mm;
}

.big_bad_button {
    background-color: #FF9999;
    border: none;
    height: 20px;
    float: left;
    margin: 30px;
    margin-left: 0;
    padding: 20px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1mm;
    color: white;
    cursor: pointer;
}

#form_data {
    height: 500px;
    margin-left: 150px;
    float: left;
    margin-top: 50px;
    width: 500px;
}

a {
    color: #FF9999;
    font-weight: 500;
}

.text_bar_input {
    width: 300px;
    height: 20px;
}

::-webkit-scrollbar {
    display: none !important;
}

</style>

<body>
    <div class='main' style='width:1366px;height:768px;margin:auto;'>
        <header style='height:72px; border-bottom:4px solid #666666;'>
            <a href='http://interactomeinsider.yulab.org/'>
                <img src='../img/miniLogo.png' width='22px' style='float:left; margin-top:30px;'>
                <h1 style='margin-top:28px;margin-left:10px;float:left;font-weight:400'> Interactome INSIDER </h1></a>
            <a class='header_link' target='_blank' href='http://interactomeinsider.yulab.org/about.html'> About </a>
            <a class='header_link' target='_blank' href='http://interactomeinsider.yulab.org/downloads.html'> Downloads </a>
            <a class='header_link' href='http://interactomeinsider.yulab.org/'> Home </a>
        </header>
        <div id='description'>
            <h2> Mutation Successfully Submitted</h2>
            <div id='text_desc'>
                Your mutation set is now being processed on our server. If you selected an email address for notification, you will be contacted once the calculations are done. Once the calculations are done, your data should be available under the mutation code <b>""" + \
    user_name + \
    """</b>
            </div>
        </div>
</body>
<script>

</script>
</html>
"""
else:
    output =  """
<head>
    <link rel="icon" href="../img/icon.png" type="image/x-icon" />
    <link rel="stylesheet" href="../css/jquery-ui.min.css">
    <link rel="stylesheet" href="../css/jquery-ui.structure.min.css">
    <link rel="stylesheet" href="../css/jquery-ui.theme.min.css">
    <link rel="stylesheet" href="../css/font-awesome-4.6.3/css/font-awesome.min.css">
    <link rel="stylesheet" href="../js/chosen.min.css">
    <script src="../js/jquery-1.11.3.min.js"></script>
    <script src="http://code.jquery.com/color/jquery.color-2.1.2.min.js" integrity="sha256-H28SdxWrZ387Ldn0qogCzFiUDDxfPiNIyJX7BECQkDE=" crossorigin="anonymous"></script>
    <script src="http://d3js.org/d3.v3.min.js"></script>
    <script src="../js/bootstrap.min.js"></script>
    <script src="../js/jquery-ui.min.js"></script>
    <script src='../js/chosen.jquery.min.js'></script>
    <title>Error - Interactome INSIDER</title>
</head>
<style>
h1 {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 24px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 300;
    line-height: 26.4px;
}

h3 {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 500;
    line-height: 15.4px;
}

p,
body {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 14px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 400;
    line-height: 20px;
}

blockquote {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 21px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 400;
    line-height: 30px;
}

pre {
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: #666666;
    font-style: normal;
    font-variant: normal;
    font-weight: 400;
    line-height: 18.5714px;
}

hr {
    border: none;
    height: 4px;
    /* Set the hr color */
    color: #666;
    /* old IE */
    background-color: #666;
    /* Modern Browsers */
}

body {
    padding: 0;
    margin: 0;
}

.header_link {
    background-color: #ccc;
    padding: 5px;
    padding-right: 10px;
    padding-left: 10px;
    float: right;
    margin-top: 24px;
    margin-right: 10px;
    margin-left: 10px;
    color: #666;
    text-decoration: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.img_container {
    width: 1366px;
    height: 320px;
    border-bottom: 4px solid #666;
}

.img_tagline {
    margin-top: 10px;
}

.header_panel {
    width: 340px;
    float: left;
    text-align: center;
    position: relative;
}

.info_panel {
    width: 340px;
    height: 220px;
    float: left;
    text-align: justify;
}

.header_pic {
    margin-top: 20px;
}

.info_container {
    width: 1366px;
    float: left;
    height: 190px;
    background-color: #ff9999;
    border-bottom: 4px solid #666;
    overflow: hidden;
}

.info_link {
    background-color: #666;
    border: 3px solid #666;
    color: white;
    padding: 4px;
    text-decoration: none;
    position: absolute;
    bottom: -30;
    padding-right: 10px;
    padding-left: 10px;
    z-index: 200;
    cursor: pointer;
    font-size: 12px;
    /*    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;*/
}

.main_textarea {
    height: 500px;
    width: 500px;
    background-color: #ddd;
    border: 2px solid #666;
    margin: 10px;
    float: left;
    margin-top: 50px;
}

#description {
    height: 500px;
    margin-left: 50px;
    float: left;
    margin-top: 50px;
}

#text_desc {
    width: 500px;
    text-align: justify;
    line-height: 8mm;
}

.big_bad_button {
    background-color: #FF9999;
    border: none;
    height: 20px;
    float: left;
    margin: 30px;
    margin-left: 0;
    padding: 20px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1mm;
    color: white;
    cursor: pointer;
}

#form_data {
    height: 500px;
    margin-left: 150px;
    float: left;
    margin-top: 50px;
    width: 500px;
}

a {
    color: #FF9999;
    font-weight: 500;
}

.text_bar_input {
    width: 300px;
    height: 20px;
}

::-webkit-scrollbar {
    display: none !important;
}

</style>

<body>
    <div class='main' style='width:1366px;height:768px;margin:auto;'>
        <header style='height:72px; border-bottom:4px solid #666666;'>
            <a href='http://interactomeinsider.yulab.org/'>
                <img src='../img/miniLogo.png' width='22px' style='float:left; margin-top:30px;'>
                <h1 style='margin-top:28px;margin-left:10px;float:left;font-weight:400'> Interactome INSIDER </h1></a>
            <a class='header_link' target='_blank' href='http://interactomeinsider.yulab.org/about.html'> About </a>
            <a class='header_link' target='_blank' href='http://interactomeinsider.yulab.org/downloads.html'> Downloads </a>
            <a class='header_link' href='http://interactomeinsider.yulab.org/'> Home </a>
        </header>
        <div id='description'>
            <h2> Mutation Could not be Submitted</h2>
            <div id='text_desc'>
                Your mutation set does not appear to be adhere to the required formatted and could not be processed on our server without error. The expected input shoud be a series of rows (one mutation per row) containing UniProtID, Position, Reference_AA, Mutant_AA separated by a single tab, space, or comma. Please double check your input matches this format and try again. If the problem persists of you believe you are seeing this message in error, please email sg2442@cornell.edu with a copy of your Mutation List file.
            </div>
        </div>
</body>
<script>

</script>
</html>
"""

print "Content-type: text/html"
print 'Content-length: ', str(len(output))
print 'Cache-Control: ', 'no-cache\n\n'
print output

sys.exit(0)
