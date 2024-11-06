if [[ $# > 0 ]]
then
    if [ $1 == "dev" ] || [ $1 == "test" ] || [ $1 == "prod" ]
    then
        export prefix=$1
    else
        echo 'Erreur : choisir dev | test | prod'
        exit
    fi
else
    export prefix="dev"
fi

sudo systemctl restart nginx
sudo systemctl stop  ${prefix}_sankeyapp
sudo systemctl start ${prefix}_sankeyapp
sudo systemctl enable ${prefix}_sankeyapp
sudo systemctl restart nginx
sudo systemctl status ${prefix}_sankeyapp --no-pager
