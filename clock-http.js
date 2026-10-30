// XHR works on the old tablets as well as modern browsers. No fetch/AbortSignal required.
export function serverDate(url, timeout=4000) {
  return new Promise((resolve,reject)=>{
    const request=new XMLHttpRequest();
    request.open('HEAD',url,true);request.timeout=timeout;
    request.onload=()=>{
      const date=Date.parse(request.getResponseHeader('Date'));
      if(request.status>=200&&request.status<300&&Number.isFinite(date))resolve(date);
      else reject(new Error('No server clock available'));
    };
    request.onerror=request.ontimeout=request.onabort=()=>reject(new Error('Clock request failed'));
    request.send();
  });
}
