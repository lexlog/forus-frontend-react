import React, { Fragment } from 'react';

export default function FundCriteriaCustomOverview({ fundKey }: { fundKey: string }) {
    return (
        <Fragment>
            {fundKey == 'bus_2020' && (
                <Fragment>
                    <p className="sign_up-pane-text">
                        U staat op het punt om een Busvoordeelabonnement aan te vragen. U dient te verklaren dat u aan
                        de voorwaarden voldoet:
                    </p>
                    <ul className="sign_up-pane-list">
                        <li>U bent 18 jaar of ouder</li>
                        <li>
                            U kunt geen gebruik maken van de OV-chipkaart voor studenten (het studentenreisproduct van
                            de DUO)
                        </li>
                        <li>U woont in Nijmegen</li>
                        <li>U bent geen inwoner van het AZC</li>
                        <li>
                            In de tabel hieronder vindt u wat uw maximale inkomen mag zijn. Gebruik ter controle uw
                            inkomen van de maand vóór de maand waarin u het abonnement aanvraagt. Voorbeeld: u vraagt op
                            3 december 2023 het abonnement aan. Dan vergelijkt u uw inkomen van november 2023 met het
                            maximale inkomen dat voor u geldt
                        </li>
                    </ul>
                    <table className="table collapse-sides">
                        <tbody>
                            <tr>
                                <th>Situatie</th>
                                <th>Vanaf 18 jaar tot uw pensioenleeftijd</th>
                                <th>Vanaf uw pensioenleeftijd</th>
                                <th>Indicatie met verblijf (in zorginstelling of verpleeghuis tot pensioenleeftijd)</th>
                                <th>
                                    Indicatie met verblijf (in zorginstelling of verpleeghuis vanaf pensioenleeftijd)
                                </th>
                            </tr>
                            <tr>
                                <td>Alleenstaand</td>
                                <td>€ 1.590,-</td>
                                <td>€ 1.770,-</td>
                                <td>€ 560,-</td>
                                <td>€ 700,-</td>
                            </tr>
                            <tr>
                                <td>Alleenstaande ouder</td>
                                <td>€ 2.040,-</td>
                                <td>€ 2.150,-</td>
                                <td>€ 810,-</td>
                                <td>€ 860,-</td>
                            </tr>
                            <tr>
                                <td>Getrouwd/samenwonend</td>
                                <td>€ 2.270,-</td>
                                <td>€ 2.390,-</td>
                                <td>€ 900,-</td>
                                <td>€ 950,-</td>
                            </tr>
                        </tbody>
                    </table>
                    <p className="sign_up-pane-text"></p>
                    <h2>Wat hoort bij het inkomen?</h2>Alle inkomsten uit werk, uitkering, pensioen, alimentatie,
                    kamerhuur, kostgeld. <br />
                    <br />
                    <h2>Wat hoort niet bij het inkomen?</h2>Zorgtoeslag, kinderopvangtoeslag, huurtoeslag, en
                    doeluitkeringen of vergoedingen (bijvoorbeeld schadevergoedingen). <br />
                    <br />
                    Wilt u weten op welke toeslagen of heffingskortingen u recht heeft? Kijk dan op de Kijk dan op de
                    website van de Belastingdienst: <a href="http://www.belastingdienst.nl/">www.belastingdienst.nl</a>.
                    Heeft u hulp hierbij nodig. De{' '}
                    <a href="https://www.nijmegen.nl/diensten/zorg-hulp-en-advies/sociaal-raadslieden-voor-juridische-hulp/">
                        sociaal raadslieden
                    </a>{' '}
                    van de gemeente Nijmegen kunnen u hierbij helpen. Bel voor een afspraak 14 024. <br />
                    <p />
                    <p className="sign_up-pane-text">
                        Door te verklaren dat u aan de voorwaarden voldoet, gaat u er mee akkoord dat uw aanvraag
                        gecontroleerd zal worden, en dat er een bedrag kan worden teruggevorderd indien u achteraf niet
                        blijkt te voldoen.
                    </p>
                </Fragment>
            )}

            {fundKey == 'meedoen' && (
                <Fragment>
                    <p className="sign_up-pane-text">
                        U staat op het punt om een meedoenregeling aan te vragen. U dient te verklaren dat u aan de
                        voorwaarden voldoet:
                    </p>
                    <ul className="sign_up-pane-list">
                        <li>U bent 18 jaar of ouder</li>
                        <li>U bent geen student</li>
                        <li>U woont in Nijmegen</li>
                        <li>U voldoet aan de maximale inkomensgrens (netto) voor de Meedoen-regeling 2024:</li>
                    </ul>
                    <table className="table collapse-sides">
                        <tbody>
                            <tr>
                                <th>Situatie</th>
                                <th>Vanaf 18 jaar tot uw pensioenleeftijd</th>
                                <th>Vanaf uw pensioenleeftijd</th>
                                <th>Wonend in zorginstelling (van 18 tot pensioenleeftijd)</th>
                                <th>Wonend in zorginstelling vanaf uw pensioenleeftijd</th>
                            </tr>
                            <tr>
                                <td>Alleenstaand</td>
                                <td>€ 1.710,-</td>
                                <td>€ 1.900,-</td>
                                <td>€ 600,-</td>
                                <td>€ 760,-</td>
                            </tr>
                            <tr>
                                <td>Alleenstaande ouder</td>
                                <td>€ 2.200,-</td>
                                <td>€ 2.320,-</td>
                                <td>€ 880,-</td>
                                <td>€ 920,-</td>
                            </tr>
                            <tr>
                                <td>Getrouwd/samenwonend</td>
                                <td>€ 2.440,-</td>
                                <td>€ 2.570,-</td>
                                <td>€ 970,-</td>
                                <td>€ 1.020,-</td>
                            </tr>
                        </tbody>
                    </table>
                    <p className="sign_up-pane-text"></p>
                    <h2>Wat hoort bij het inkomen?</h2>Alle inkomsten uit werk, uitkering, pensioen, alimentatie,
                    kamerhuur, kostgeld. <br />
                    <br />
                    <h2>Wat hoort niet bij het inkomen?</h2>Zorgtoeslag, kinderopvangtoeslag, huurtoeslag, en
                    doeluitkeringen of vergoedingen (bijvoorbeeld schadevergoedingen). <br />
                    <br />
                    Wilt u weten op welke toeslagen of heffingskortingen u recht heeft? Kijk dan op de Kijk dan op de
                    website van de Belastingdienst: <a href="http://www.belastingdienst.nl/">www.belastingdienst.nl</a>.
                    Heeft u hulp hierbij nodig. De{' '}
                    <a href="https://www.nijmegen.nl/diensten/zorg-hulp-en-advies/sociaal-raadslieden-voor-juridische-hulp/">
                        sociaal raadslieden
                    </a>{' '}
                    van de gemeente Nijmegen kunnen u hierbij helpen. Bel voor een afspraak 14 024. <br />
                    <p />
                    <p className="sign_up-pane-text">
                        Door te verklaren dat u aan de voorwaarden voldoet, gaat u er mee akkoord dat uw aanvraag
                        gecontroleerd zal worden, en dat het bedrag van €150,- zal worden teruggevorderd indien u
                        achteraf niet blijkt te voldoen.
                    </p>
                </Fragment>
            )}

            {fundKey == 'IIT' && (
                <Fragment>
                    <h3>
                        U (en uw partner) willen de Individuele Inkomenstoeslag aanvragen. Daarvoor moet u aan
                        onderstaande voorwaarden voldoen:
                    </h3>
                    <ul className="sign_up-pane-list">
                        <li>U heeft de afgelopen 12 maanden geen Individuele Inkomenstoeslag ontvangen</li>
                        <li>U woont in Nijmegen</li>
                        <li>Uw partner (als u die heeft) is akkoord met het aanvragen van deze regeling</li>
                        <li>
                            U bent 21 jaar of ouder, maar nog niet met pensioen. Heeft u een partner en ontvangt één van
                            u een pensioen (AOW) dan heeft u allebei geen recht op de individuele inkomenstoeslag
                        </li>
                        <li>U bent Nederlander of u heeft een geldige verblijfsvergunning</li>
                        <li>U bent geen student en u heeft de afgelopen 3 jaar (36 maanden) geen studie gevolgd</li>
                        <li>
                            Uw vermogen is niet hoger dan € 7.575,- (alleenstaande) of € 15.150,- (voor alleenstaande
                            ouders of gehuwden/samenwonenden)
                        </li>
                        <li>
                            U heeft minstens 3 jaar een laag inkomen. Uw gemiddeld inkomen mag niet hoger zijn dan de
                            inkomensgrens die voor u geldt
                        </li>
                        <li>
                            Houdt een deurwaarder een bedrag in op uw inkomen? Of heeft de belastingdienst beslag gelegd
                            op uw inkomen? Ook dan mag uw inkomen (zonder inhoudingen) niet hoger zijn dan de
                            inkomensgrens
                        </li>
                        <li>
                            Heeft u een regeling met bureau Schuldhulpverlening van de gemeente Nijmegen? Of heeft de
                            rechter beslist dat u mag meedoen aan een schuldsanering-traject? Ook dan mag uw inkomen
                            (zonder inhoudingen) niet hoger zijn dan de inkomensgrens
                        </li>
                        <li>U heeft geen of heel weinig kans op een baan of op hogere inkomsten</li>
                        <br />
                    </ul>
                </Fragment>
            )}
        </Fragment>
    );
}
