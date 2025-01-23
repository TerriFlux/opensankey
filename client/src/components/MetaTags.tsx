
import React, { FunctionComponent } from 'react'
import { Helmet } from 'react-helmet-async'

import { Class_ApplicationDataSA } from '../types/ApplicationDataSA'

type FCType_MetaTags = {
  new_data_app: Class_ApplicationDataSA
}
// You can have more props. In my case, these are enough.
export const MetaTags: FunctionComponent<FCType_MetaTags> = (
  {new_data_app}
) => {
  return (
    <Helmet>
      { /* Standard metadata tags */ }
      <title>{new_data_app.t('metatags.title')}</title>
      <link rel='canonical' href={ window.location.href } />
      <meta name="keywords" content={new_data_app.t('metatags.kw')}/>
      <meta name='description' content={new_data_app.t('metatags.descr')} />
      <meta name="subject" content={new_data_app.t('metatags.subject')}/>
      { /* Open Graph tags (OG) */ }
      <meta property="og:url" content={window.location.href} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={new_data_app.t('metatags.title')} />
      <meta property="og:description" content={new_data_app.t('metatags.descr')} />
      {/* OG image tags */}
      <meta property="og:image" content={new_data_app.t('metatags.image')} />
      <meta property="og:image:secure_url" content={new_data_app.t('metatags.image')} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="200" />
      <meta property="og:image:alt" content={'Image of ' + new_data_app.t('metatags.title') + ' site'} />
      { /* Twitter tags */ }
      <meta name="twitter:creator" content={new_data_app.t('metatags.name')} />
      <meta name="twitter:title" content={new_data_app.t('metatags.title')} />
      <meta name="twitter:description" content={new_data_app.t('metatags.descr')} />
    </Helmet>
  )
}
