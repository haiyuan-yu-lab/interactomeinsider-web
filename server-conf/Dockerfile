FROM python:2
WORKDIR /usr/src/app

RUN apt -y update \
    && apt install -y gfortran libopenblas-dev liblapack-dev

# set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

COPY ./requirements.txt .
RUN pip install -r requirements.txt

RUN apt -y update \
    && apt install -y apache2

COPY ./interactomeinsider.conf /etc/apache2/sites-available/
RUN a2enmod cgi
RUN a2ensite interactomeinsider
RUN a2dissite 000-default.conf

# create app user
RUN mkdir -p /app
# RUN groupadd app
# RUN useradd -rm -d /home/app -s /bin/bash -g app -u 1001 app

# create the appropriate directories
ENV HOME=/app
ENV APP_HOME=/app/insider
RUN mkdir $APP_HOME
WORKDIR $APP_HOME

# install dependencies
# COPY --from=builder /usr/src/app/wheels /wheels
# COPY --from=builder /usr/src/app/requirements.txt .
# RUN pip install --no-cache /wheels/*

# copy entrypoint.sh
COPY ./entrypoint.sh $APP_HOME
RUN sed -i 's/\r$//g' $APP_HOME/entrypoint.sh

COPY . $APP_HOME

# RUN chown -R app:app $APP_HOME
RUN chmod +x $APP_HOME/entrypoint.sh

# USER app
# RUN chmod +x $APP_HOME/entrypoint.sh

ENTRYPOINT ["/app/insider/entrypoint.sh"]
