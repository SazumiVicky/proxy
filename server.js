/*
* dev: Sazumi Viki
* ig: @moe.sazumiviki
* gh: github.com/sazumivicky
* site: sazumi.moe
*/

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const vm = require('vm');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/my-proxy', async (req, res) => {
    try {
        const { country, proxyType } = req.query;

        const response = await axios.get('https://www.proxynova.com/proxy-server-list/');
        const html = response.data;

        const $ = cheerio.load(html);

        if (req.query.list) {
            const countries = [];
            const proxyTypes = [];
            $('#proxy_country option').each((index, element) => {
                if ($(element).val() !== '') {
                    countries.push($(element).val());
                }
            });
            $('#lst_proxy_level option').each((index, element) => {
                if ($(element).val() !== 'all') {
                    proxyTypes.push($(element).val());
                }
            });

            const jsonResponse = { countries, proxyTypes };

            res.setHeader("Content-Type", "application/json");
            res.send(JSON.stringify(jsonResponse, null, 2));
        } else {
            const proxies = [];
            $('#tbl_proxy_list tbody tr').each((index, element) => {
                const proxyCountry = $(element).find('td:nth-child(6) img').attr('alt').toLowerCase();
                const proxyTypeText = $(element).find('td:nth-child(7) span').text().toLowerCase();

                if ((country === 'all' || proxyCountry === country) &&
                    (proxyType === 'all' || proxyTypeText === proxyType)) {
                    const ipScript = $(element).find('td:nth-child(1) script').html();
                    try {
                        const context = { document: { write: (ip) => ip } };
                        const ip = vm.runInNewContext(ipScript, context);
                        const proxy = {
                            ip: ip,
                            port: $(element).find('td:nth-child(2)').text().trim(),
                            lastCheck: $(element).find('td:nth-child(3) time').attr('datetime'),
                            proxySpeed: $(element).find('td:nth-child(4) small').text().trim(),
                            uptime: $(element).find('td:nth-child(5) span').text().trim(),
                            country: proxyCountry,
                            anonymity: proxyTypeText
                        };
                        proxies.push(proxy);
                    } catch (error) {
                        console.error("Error parsing IP script:", error);
                    }
                }
            });

            const jsonResponse = { proxies };

            res.setHeader("Content-Type", "application/json");
            res.send(JSON.stringify(jsonResponse, null, 2));
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
    res.redirect('/');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
